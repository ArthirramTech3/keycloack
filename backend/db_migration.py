import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

engine = create_engine(DATABASE_URL)

def run_migrations():
    # Add 'description' column
    try:
        with engine.connect() as connection:
            with connection.begin():
                print("Adding 'description' column to 'organizations' table...")
                connection.execute(text('ALTER TABLE organizations ADD COLUMN description TEXT'))
                print("✅ Column 'description' added successfully.")
    except Exception as e:
        if 'already exists' in str(e):
            print("✅ Column 'description' already exists.")
        else:
            print(f"❌ Failed to add 'description' column: {e}")

    # Add 'openrouter_api_key' column
    try:
        with engine.connect() as connection:
            with connection.begin():
                print("Adding 'openrouter_api_key' column to 'organizations' table...")
                connection.execute(text('ALTER TABLE organizations ADD COLUMN openrouter_api_key VARCHAR(500)'))
                print("✅ Column 'openrouter_api_key' added successfully.")
    except Exception as e:
        if 'already exists' in str(e):
            print("✅ Column 'openrouter_api_key' already exists.")
        else:
            print(f"❌ Failed to add 'openrouter_api_key' column: {e}")

if __name__ == "__main__":
    run_migrations()