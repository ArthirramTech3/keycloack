import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

engine = create_engine(DATABASE_URL)

def add_description_column():
    with engine.connect() as connection:
        try:
            print("Adding 'description' column to 'organizations' table...")
            # Use transactional DDL
            trans = connection.begin()
            connection.execute(text('ALTER TABLE organizations ADD COLUMN description TEXT'))
            trans.commit()
            print("✅ Column 'description' added successfully.")
        except Exception as e:
            # Check if the column already exists
            if 'already exists' in str(e):
                 print("✅ Column 'description' already exists.")
            else:
                print(f"❌ Failed to add column: {e}")
                if 'trans' in locals() and trans.is_active:
                    trans.rollback()


if __name__ == "__main__":
    add_description_column()
