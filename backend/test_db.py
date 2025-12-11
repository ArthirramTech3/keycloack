#!/usr/bin/env python3
"""
Script to test database connection and create tables
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from models import *
from sqlalchemy import inspect

def main():
    print("Testing database connection...")
    
    # Test connection
    try:
        with engine.connect() as conn:
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Check existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Existing tables: {existing_tables}")
    
    # Create all tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Check new tables
        new_tables = inspector.get_table_names()
        print(f"New tables: {new_tables}")
        
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return
    
    print("✅ Database setup complete")

if __name__ == "__main__":
    main()
