import requests
import os

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000/api")

def get_system_stats(token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = requests.get(f"{API_BASE_URL}/stats/system", headers=headers)
    return response.json() if response.status_code == 200 else None
