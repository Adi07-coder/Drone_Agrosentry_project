import sys
import os
from datetime import datetime
import pandas as pd
from pymongo import MongoClient

# MongoClient setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/AgroSentryDB")
client = MongoClient(MONGO_URI)
db = client["AgroSentryDB"]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def export_type(dtype):
    collection_name = "realtimepredictions" if dtype == "realtime" else "uploadpredictions"
    subdir = "realtime_detection" if dtype == "realtime" else "upload_detection"
    target_dir = os.path.join(BASE_DIR, "local_storage", "detections", subdir)
    
    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(os.path.join(target_dir, "images"), exist_ok=True)
    
    collection = db[collection_name]
    records = list(collection.find().sort("timestamp", -1))
    
    data = []
    for r in records:
        ts = r.get("timestamp")
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S") if ts else ""
        
        # Build dataset rows
        row = {
            "Timestamp": ts_str,
            "Plant Name": r.get("plantName", ""),
            "Disease Name": r.get("diseaseName", ""),
            "Confidence": f"{r.get('confidence', 0.0):.2f}%",
            "Healthy/Diseased": r.get("status", ""),
            "Image Path": r.get("imagePath", "")
        }
        if dtype == "upload":
            img_path = r.get("imagePath", "")
            file_name = os.path.basename(img_path) if img_path else ""
            row = {
                "Timestamp": ts_str,
                "Uploaded File Name": file_name,
                "Plant Name": r.get("plantName", ""),
                "Disease Name": r.get("diseaseName", ""),
                "Confidence": f"{r.get('confidence', 0.0):.2f}%",
                "Healthy/Diseased": r.get("status", ""),
                "Image Path": img_path
            }
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # If no data, write empty dataframes with correct columns to avoid Pandas exceptions
    if df.empty:
        columns = ["Timestamp", "Plant Name", "Disease Name", "Confidence", "Healthy/Diseased", "Image Path"]
        if dtype == "upload":
            columns = ["Timestamp", "Uploaded File Name", "Plant Name", "Disease Name", "Confidence", "Healthy/Diseased", "Image Path"]
        df = pd.DataFrame(columns=columns)
    
    csv_dir = os.path.join(BASE_DIR, "local_storage", "csv_reports")
    excel_dir = os.path.join(BASE_DIR, "local_storage", "excel_reports")
    os.makedirs(csv_dir, exist_ok=True)
    os.makedirs(excel_dir, exist_ok=True)
    
    csv_path = os.path.join(csv_dir, f"{dtype}_history.csv")
    xlsx_path = os.path.join(excel_dir, f"{dtype}_history.xlsx")
    
    # Save CSV
    df.to_csv(csv_path, index=False)
    
    # Save Excel
    df.to_excel(xlsx_path, index=False)
    print(f"Exported {dtype} successful")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        export_type("realtime")
        export_type("upload")
    else:
        export_type(sys.argv[1])
