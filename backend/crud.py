from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from fastapi import HTTPException
import datetime
import models, schemas
from auth import get_password_hash

# --- Users ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed = get_password_hash(user.password)
    db_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    return db.query(models.User).all()

# --- Products ---
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, user_id: int = None):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.flush()
    # Log stock movement
    movement = models.StockMovement(
        product_id=db_product.id,
        movement_type=models.MovementType.PRODUCT_CREATED,
        quantity_change=db_product.quantity,
        quantity_before=0,
        quantity_after=db_product.quantity,
        note="Product created with initial stock",
        created_by=user_id
    )
    db.add(movement)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int, user_id: int = None):
    db_product = get_product(db, product_id)
    if db_product:
        movement = models.StockMovement(
            product_id=db_product.id,
            movement_type=models.MovementType.PRODUCT_DELETED,
            quantity_change=-db_product.quantity,
            quantity_before=db_product.quantity,
            quantity_after=0,
            note=f"Product '{db_product.name}' deleted",
            created_by=user_id
        )
        db.add(movement)
        db.delete(db_product)
        db.commit()
    return db_product

def adjust_stock(db: Session, product_id: int, request: schemas.StockAdjustRequest, user_id: int = None):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    quantity_before = db_product.quantity
    new_qty = quantity_before + request.quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Stock cannot go below zero")
    
    movement_type = models.MovementType.STOCK_IN if request.quantity_change > 0 else models.MovementType.STOCK_ADJUSTMENT
    if request.movement_type == "STOCK_ADJUSTMENT":
        movement_type = models.MovementType.STOCK_ADJUSTMENT

    db_product.quantity = new_qty
    movement = models.StockMovement(
        product_id=product_id,
        movement_type=movement_type,
        quantity_change=request.quantity_change,
        quantity_before=quantity_before,
        quantity_after=new_qty,
        note=request.note,
        created_by=user_id
    )
    db.add(movement)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_stock_movements(db: Session, product_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.StockMovement)
    if product_id:
        query = query.filter(models.StockMovement.product_id == product_id)
    return query.order_by(models.StockMovement.created_at.desc()).offset(skip).limit(limit).all()

# --- Customers ---
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        db.delete(db_customer)
        db.commit()
    return db_customer

# --- Orders ---
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate, user_id: int = None):
    customer = get_customer(db, order.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_order = models.Order(customer_id=order.customer_id, total_amount=0, notes=order.notes)
    db.add(db_order)
    db.flush()

    total_amount = 0
    for item in order.items:
        product = get_product(db, item.product_id)
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}")

        qty_before = product.quantity
        product.quantity -= item.quantity
        total_amount += product.price * item.quantity

        movement = models.StockMovement(
            product_id=product.id,
            movement_type=models.MovementType.STOCK_OUT,
            quantity_change=-item.quantity,
            quantity_before=qty_before,
            quantity_after=product.quantity,
            note=f"Order #{db_order.id} placed",
            created_by=user_id
        )
        db.add(movement)

        db_order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price_at_time=product.price
        )
        db.add(db_order_item)

    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int, user_id: int = None):
    db_order = get_order(db, order_id)
    if db_order:
        for item in db_order.items:
            product = get_product(db, item.product_id)
            if product:
                qty_before = product.quantity
                product.quantity += item.quantity
                movement = models.StockMovement(
                    product_id=product.id,
                    movement_type=models.MovementType.STOCK_IN,
                    quantity_change=item.quantity,
                    quantity_before=qty_before,
                    quantity_after=product.quantity,
                    note=f"Order #{order_id} cancelled - stock restored",
                    created_by=user_id
                )
                db.add(movement)
        db.delete(db_order)
        db.commit()
    return db_order

# --- Analytics ---
def get_dashboard_summary(db: Session):
    today = datetime.datetime.utcnow().date()
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock = db.query(models.Product).filter(
        models.Product.quantity <= models.Product.low_stock_threshold
    ).count()
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0
    revenue_today = db.query(func.sum(models.Order.total_amount)).filter(
        cast(models.Order.created_at, Date) == today
    ).scalar() or 0
    orders_today = db.query(models.Order).filter(
        cast(models.Order.created_at, Date) == today
    ).count()
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock,
        "total_revenue": round(total_revenue, 2),
        "revenue_today": round(revenue_today, 2),
        "orders_today": orders_today
    }

def get_sales_trend(db: Session, days: int = 7):
    result = []
    for i in range(days - 1, -1, -1):
        day = (datetime.datetime.utcnow() - datetime.timedelta(days=i)).date()
        revenue = db.query(func.sum(models.Order.total_amount)).filter(
            cast(models.Order.created_at, Date) == day
        ).scalar() or 0
        orders = db.query(models.Order).filter(
            cast(models.Order.created_at, Date) == day
        ).count()
        result.append({"date": str(day), "revenue": round(revenue, 2), "orders": orders})
    return result

def get_top_products(db: Session, limit: int = 5):
    rows = db.query(
        models.OrderItem.product_id,
        models.Product.name,
        func.sum(models.OrderItem.quantity).label("total_sold"),
        func.sum(models.OrderItem.quantity * models.OrderItem.price_at_time).label("revenue")
    ).join(models.Product, models.Product.id == models.OrderItem.product_id
    ).group_by(models.OrderItem.product_id, models.Product.name
    ).order_by(func.sum(models.OrderItem.quantity).desc()
    ).limit(limit).all()
    return [{"product_id": r.product_id, "name": r.name, "total_sold": r.total_sold, "revenue": round(r.revenue, 2)} for r in rows]

def get_low_stock_products(db: Session):
    return db.query(models.Product).filter(
        models.Product.quantity <= models.Product.low_stock_threshold
    ).all()
