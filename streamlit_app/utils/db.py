import pymongo
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/AgroSentryDB")

def get_mongo_client():
    return pymongo.MongoClient(MONGO_URI)
