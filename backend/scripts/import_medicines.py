# import pandas as pd
# from pymongo import MongoClient

# # ==========================
# # CONFIGURATION
# # ==========================
# EXCEL_FILE_PATH = "data/medicines.csv"
# MONGO_URI = "mongodb://localhost:27017/"
# DB_NAME = "healwise"
# COLLECTION_NAME = "medicines"

# # ==========================
# # CONNECT TO MONGODB
# # ==========================
# client = MongoClient(MONGO_URI)
# db = client[DB_NAME]
# collection = db[COLLECTION_NAME]

# # ==========================
# # READ EXCEL FILE
# # ==========================
# df = pd.read_csv(EXCEL_FILE_PATH)

# # Normalize column names (safety)
# df.columns = df.columns.str.strip().str.lower()

# # ==========================
# # CLEAN & VALIDATE DATA
# # ==========================
# required_columns = {"name", "manufacturer", "price", "salt_name", "strength"}

# if not required_columns.issubset(set(df.columns)):
#     raise Exception(f"Excel file must contain columns: {required_columns}")

# df = df.dropna(subset=["name", "salt_name"])
# df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)

# # ==========================
# # INSERT INTO MONGODB
# # ==========================
# records = df.to_dict(orient="records")

# if records:
#     collection.insert_many(records)
#     print(f"✅ Successfully inserted {len(records)} medicines into 'healwise.medicines'")
# else:
#     print("⚠ No valid records found to insert.")

# # ==========================
# # CLOSE CONNECTION
# # ==========================
# client.close()

import pandas as pd
from pymongo import MongoClient

# ==========================
# CONFIGURATION
# ==========================
EXCEL_FILE_PATH = "data/medicines.csv"
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "healwise"
COLLECTION_NAME = "medicines"

# ==========================
# CONNECT TO MONGODB
# ==========================
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# ==========================
# READ CSV FILE
# ==========================
df = pd.read_csv(EXCEL_FILE_PATH)

# Normalize column names
df.columns = df.columns.str.strip().str.lower()

# Rename column
if "salt_name" in df.columns:
    df.rename(columns={"salt_name": "salt"}, inplace=True)

# Drop unnecessary columns (keep only these)
df = df[["name", "manufacturer", "price", "salt", "strength"]]

# ==========================
# CLEAN DATA
# ==========================
df = df.dropna(subset=["name", "salt"])  # must have name & salt

# Fix price: remove 'Rs', 'Rs.', commas, and extra spaces
# keeping only digits and decimal points
df["price"] = df["price"].astype(str).str.replace(r"[^\d.]", "", regex=True)
df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)
df["price"] = df["price"].astype(float)

# Fill missing strength with empty string
df["strength"] = df["strength"].fillna("")

# ==========================
# INSERT INTO MONGODB (allow duplicates)
# ==========================
records = df.to_dict(orient="records")
if records:
    collection.insert_many(records)
    print(f"✅ Successfully inserted {len(records)} medicines into '{DB_NAME}.{COLLECTION_NAME}'")
else:
    print("⚠ No valid records found to insert.")

# ==========================
# CLOSE CONNECTION
# ==========================
client.close()

