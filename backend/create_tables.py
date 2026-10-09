"""Create tables in Neon (or sqlite dev fallback). Run: uv run python create_tables.py"""
from app.db import engine, Base
import app.models  # noqa
Base.metadata.create_all(bind=engine)
print("tables created")
