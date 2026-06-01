from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import datetime

# --- Auth ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "manager"

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- Products ---
class ProductBase(BaseModel):
    name: str
    sku: str
    category: Optional[str] = "General"
    price: float = Field(gt=0)
    quantity: int = Field(ge=0)
    low_stock_threshold: Optional[int] = 10

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- Stock Movement ---
class StockAdjustRequest(BaseModel):
    quantity_change: int
    movement_type: str  # STOCK_IN or STOCK_ADJUSTMENT
    note: Optional[str] = None

class StockMovementOut(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity_change: int
    quantity_before: int
    quantity_after: int
    note: Optional[str]
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- Customers ---
class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- Orders ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemOut(OrderItemBase):
    id: int
    price_at_time: float
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    customer_id: int
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderOut(OrderBase):
    id: int
    total_amount: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItemOut]
    class Config:
        from_attributes = True

# --- Analytics ---
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: int
    total_revenue: float
    revenue_today: float
    orders_today: int

class SalesTrend(BaseModel):
    date: str
    revenue: float
    orders: int

class TopProduct(BaseModel):
    product_id: int
    name: str
    total_sold: int
    revenue: float

class StockAlert(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    low_stock_threshold: int
