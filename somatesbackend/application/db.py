# import os
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base
# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# from dotenv import load_dotenv

# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")
# print("DATABASE_URL:", DATABASE_URL)

# # --------------------
# # Sync engine (for creating tables)
# # --------------------
# sync_engine = create_engine(DATABASE_URL.replace("+asyncpg", ""), echo=True)
# SessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)

# # --------------------
# # Base
# # --------------------
# Base = declarative_base()

# # --------------------
# # Create tables once
# # --------------------
# Base.metadata.create_all(bind=sync_engine)

# # --------------------
# # Async engine
# # --------------------
# async_engine = create_async_engine(DATABASE_URL, echo=True)
# async_session = sessionmaker(
#     async_engine, expire_on_commit=False, class_=AsyncSession
# )

# # --------------------
# # Dependencies
# # --------------------
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# async def get_async_session():
#     async with async_session() as session:
#         yield session


import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from dotenv import load_dotenv

load_dotenv()

# --------------------
# Load & validate URL
# --------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment variables!")

# --------------------
# Build sync URL for psycopg2
# postgresql+asyncpg://... → postgresql://...
# Also remove channel_binding (not supported by psycopg2 via SQLAlchemy)
# --------------------
SYNC_URL = (
    DATABASE_URL
    .replace("+asyncpg", "")
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "")
)

# --------------------
# Build async URL for asyncpg
# Must start with postgresql+asyncpg://
# asyncpg does NOT support channel_binding parameter
# --------------------
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    ASYNC_URL = DATABASE_URL  # already has +asyncpg

ASYNC_URL = (
    ASYNC_URL
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "")
)

# If sslmode was the first param, fix dangling & → ?
# e.g. ?sslmode=require&channel_binding=require → ?sslmode=require ✅

print("Sync URL driver:", SYNC_URL.split("://")[0])
print("Async URL driver:", ASYNC_URL.split("://")[0])

# --------------------
# Base
# --------------------
Base = declarative_base()

# --------------------
# Sync engine (psycopg2 - used for table creation)
# --------------------
sync_engine = create_engine(
    SYNC_URL,
    connect_args={"sslmode": "require"},  # Neon requires SSL
    echo=True,
    pool_pre_ping=True  # auto-reconnect if connection drops
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False
)

# --------------------
# Async engine (asyncpg - used in FastAPI routes)
# --------------------
async_engine = create_async_engine(
    ASYNC_URL,
    connect_args={"ssl": "require"},  # asyncpg uses 'ssl' not 'sslmode'
    echo=True,
    pool_pre_ping=True
)

async_session = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# --------------------
# Create all tables (called in startup)
# --------------------
def create_tables():
    try:
        print("Creating tables...")
        Base.metadata.create_all(bind=sync_engine)
        print("Tables created successfully")
    except Exception as e:
        import traceback
        print("Error creating tables:", e)
        traceback.print_exc()
        raise e

# --------------------
# Sync DB session dependency
# --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------
# Async DB session dependency
# --------------------
async def get_async_session():
    async with async_session() as session:
        yield session
