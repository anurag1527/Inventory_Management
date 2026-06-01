from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, crud
from database import engine, get_db
from auth import (
    verify_password, create_access_token,
    get_current_user, require_admin, require_admin_or_manager
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Inventory & Order Management API"}

# ============================================================
# AUTH
# ============================================================
@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@app.post("/auth/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, request.email)
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/auth/users", response_model=List[schemas.UserOut])
def get_users(current_user: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    return crud.get_all_users(db)

# ============================================================
# PRODUCTS
# ============================================================
@app.post("/products", response_model=schemas.Product, status_code=201)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    if crud.get_product_by_sku(db, product.sku):
        raise HTTPException(status_code=400, detail="SKU already registered")
    return crud.create_product(db, product, user_id=current_user.id)

@app.get("/products", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_products(db, skip=skip, limit=limit)

@app.get("/products/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    p = crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    existing = crud.get_product_by_sku(db, product.sku)
    if existing and existing.id != product_id:
        raise HTTPException(status_code=400, detail="SKU already used by another product")
    p = crud.update_product(db, product_id, product)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

@app.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    p = crud.delete_product(db, product_id, user_id=current_user.id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

@app.post("/products/{product_id}/adjust-stock", response_model=schemas.Product)
def adjust_stock(
    product_id: int,
    request: schemas.StockAdjustRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.adjust_stock(db, product_id, request, user_id=current_user.id)

# ============================================================
# STOCK MOVEMENTS
# ============================================================
@app.get("/stock-movements", response_model=List[schemas.StockMovementOut])
def get_stock_movements(
    product_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_stock_movements(db, product_id=product_id, skip=skip, limit=limit)

# ============================================================
# CUSTOMERS
# ============================================================
@app.post("/customers", response_model=schemas.Customer, status_code=201)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    if crud.get_customer_by_email(db, customer.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_customer(db, customer)

@app.get("/customers", response_model=List[schemas.Customer])
def read_customers(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_customers(db, skip=skip, limit=limit)

@app.get("/customers/{customer_id}", response_model=schemas.Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    c = crud.get_customer(db, customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c

@app.delete("/customers/{customer_id}", status_code=204)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    c = crud.delete_customer(db, customer_id)
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

# ============================================================
# ORDERS
# ============================================================
@app.post("/orders", response_model=schemas.OrderOut, status_code=201)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_manager)
):
    return crud.create_order(db, order, user_id=current_user.id)

@app.get("/orders", response_model=List[schemas.OrderOut])
def read_orders(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_orders(db, skip=skip, limit=limit)

@app.get("/orders/{order_id}", response_model=schemas.OrderOut)
def read_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    o = crud.get_order(db, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o

@app.delete("/orders/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    o = crud.delete_order(db, order_id, user_id=current_user.id)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

# ============================================================
# ANALYTICS & DASHBOARD
# ============================================================
@app.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_dashboard_summary(db)

@app.get("/analytics/sales-trend")
def sales_trend(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_sales_trend(db, days=days)

@app.get("/analytics/top-products")
def top_products(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_top_products(db, limit=limit)

@app.get("/analytics/low-stock", response_model=List[schemas.StockAlert])
def low_stock(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_low_stock_products(db)
