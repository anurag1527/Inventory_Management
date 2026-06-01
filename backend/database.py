import os
import time
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@db:5432/inventory_db"
)
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = db_url

def create_engine_with_retry(url, max_retries=10, delay=3):
    """Try to connect to the database with retries."""
    for attempt in range(1, max_retries + 1):
        try:
            engine = create_engine(url)
            # Test the connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection established successfully.")
            return engine
        except Exception as e:
            logger.warning(f"⏳ Database connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                logger.error("❌ Could not connect to the database after multiple retries.")
                raise

engine = create_engine_with_retry(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
