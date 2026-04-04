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

# --------------------
# Load environment variables
# --------------------
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE_URL:", DATABASE_URL)

# --------------------
# Base class
# --------------------
Base = declarative_base()

# --------------------
# Sync engine for table creation
# --------------------
# Remove +asyncpg for sync engine
sync_engine = create_engine(
    DATABASE_URL.replace("+asyncpg", ""), echo=True
)

# Session for sync operations (like create_all)
SessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False
)

# --------------------
# Async engine for normal DB operations
# --------------------
async_engine = create_async_engine(
    DATABASE_URL,
    echo=True
)

async_session = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# --------------------
# Function to create tables (call in startup)
# --------------------
def create_tables():
    try:
        Base.metadata.create_all(bind=sync_engine)
        print("Tables created successfully")
    except Exception as e:
        print("Error creating tables:", e)

# --------------------
# Dependency: sync session (rarely used)
# --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------
# Dependency: async session (for FastAPI routes)
# --------------------
async def get_async_session():
    async with async_session() as session:
        yield session

