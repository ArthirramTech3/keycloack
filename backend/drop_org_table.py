import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

engine = create_engine(DATABASE_URL)

def drop_table():
    with engine.connect() as connection:
        try:
            print("Dropping 'organizations' table...")
            trans = connection.begin()
            # Using CASCADE to drop dependent objects
            connection.execute(text('DROP TABLE IF EXISTS organizations CASCADE'))
            trans.commit()
            print("✅ Table 'organizations' dropped successfully.")
        except Exception as e:
            print(f"❌ Failed to drop table: {e}")
            if 'trans' in locals() and trans.is_active:
                trans.rollback()

if __name__ == "__main__":
    drop_table()
