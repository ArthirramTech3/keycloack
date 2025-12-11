import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

engine = create_engine(DATABASE_URL)

def remove_model_id_from_allowed_models():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            print("Removing 'model_id' column from 'allowed_models' table...")
            connection.execute(text('ALTER TABLE allowed_models DROP COLUMN IF EXISTS model_id'))
            print("✅ Column 'model_id' removed successfully.")
            trans.commit()
        except Exception as e:
            print(f"❌ Failed to remove column: {e}")
            trans.rollback()

if __name__ == "__main__":
    remove_model_id_from_allowed_models()
