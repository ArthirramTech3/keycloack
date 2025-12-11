import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

engine = create_engine(DATABASE_URL)

def add_columns_to_allowed_models():
    columns_to_add = {
        "model_name": "VARCHAR(255)",
        "provider": "VARCHAR(255)",
        "creator_id": "VARCHAR(255)",
        "is_public": "BOOLEAN",
        "is_active": "BOOLEAN",
        "api_url": "VARCHAR(500)",
        "api_key": "VARCHAR(500)"
    }

    with engine.connect() as connection:
        trans = connection.begin()
        try:
            for column_name, column_type in columns_to_add.items():
                print(f"Adding '{column_name}' column to 'allowed_models' table...")
                connection.execute(text(f'ALTER TABLE allowed_models ADD COLUMN IF NOT EXISTS {column_name} {column_type}'))
                print(f"✅ Column '{column_name}' handled successfully.")
            trans.commit()
        except Exception as e:
            print(f"❌ Failed to add columns: {e}")
            trans.rollback()

if __name__ == "__main__":
    add_columns_to_allowed_models()
