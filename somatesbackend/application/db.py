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
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# --------------------
# Load environment variables
# --------------------
load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://neondb_owner:npg_V9JKE1zpnjNC@ep-mute-pond-anwkublt-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)
print("DATABASE_URL:", DATABASE_URL)

# --------------------
# Base class for models
# --------------------
Base = declarative_base()

# --------------------
# Async engine and session
# --------------------
async_engine = create_async_engine(DATABASE_URL, echo=True)

async_session = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# --------------------
# Function to create tables (call on startup)
# --------------------
def create_tables():
    # Use a synchronous engine just for creating tables
    from sqlalchemy import create_engine
    sync_engine = create_engine(DATABASE_URL.replace("+asyncpg", ""), echo=True)
    Base.metadata.create_all(bind=sync_engine)
    print("Tables created successfully")

# --------------------
# Dependency: async session for FastAPI routes
# --------------------
async def get_async_session():
    async with async_session() as session:
        yield session
