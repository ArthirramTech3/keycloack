import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

engine = create_engine(DATABASE_URL)

def allow_null_organization_id():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            print("Allowing NULL for 'organization_id' column in 'allowed_models' table...")
            connection.execute(text('ALTER TABLE allowed_models ALTER COLUMN organization_id DROP NOT NULL'))
            print("✅ Column 'organization_id' modified successfully.")
            trans.commit()
        except Exception as e:
            print(f"❌ Failed to modify column: {e}")
            trans.rollback()

if __name__ == "__main__":
    allow_null_organization_id()
