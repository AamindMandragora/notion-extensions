from flask import Flask, jsonify, send_from_directory
from notion import fetch_tasks
from collections import defaultdict
from datetime import datetime
import json
import os
import threading
import time

app = Flask(__name__, static_folder="static")

CACHE_FILE = "task_cache.json"
CACHE_REFRESH_INTERVAL = 30

def aggregate_daily(person, tasks):
    """Return dict date -> count of tasks for given list of tasks"""
    daily_counts = defaultdict(int)
    for task in tasks:
        if (person == "adi"):
            date_str = task["properties"]['Scheduled Date']["date"]["start"]
        elif (person == "aashima"):
            date_str = task["properties"]["date estimated"]["date"]
            if (not date_str):
                date_str = task["properties"]["date due"]["date"]
            date_str = date_str["start"]
        date_obj = datetime.fromisoformat(date_str).date()
        daily_counts[date_obj.isoformat()] += 1
    return daily_counts

def fetch_and_cache_tasks():
    """Fetch tasks from Notion and cache them to JSON file"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Fetching tasks from Notion...")
    try:
        adi_tasks = fetch_tasks("adi", "winter_break")
        aashima_tasks = fetch_tasks("aashima", "winter_break")

        adi_daily = aggregate_daily("adi", adi_tasks)
        aashima_daily = aggregate_daily("aashima", aashima_tasks)

        all_dates_raw = sorted(set(adi_daily) | set(aashima_daily))
        all_dates = [datetime.fromisoformat(d).strftime("%b %d") for d in all_dates_raw]

        adi_cum, aashima_cum = [], []
        cum_adi = cum_aashima = 0
        for d_raw in all_dates_raw:
            cum_adi += adi_daily.get(d_raw, 0)
            cum_aashima += aashima_daily.get(d_raw, 0)
            adi_cum.append(cum_adi)
            aashima_cum.append(cum_aashima)

        cache_data = {
            "dates": all_dates,
            "adi": {
                "daily": [adi_daily.get(d, 0) for d in all_dates_raw],
                "cumulative": adi_cum
            },
            "aashima": {
                "daily": [aashima_daily.get(d, 0) for d in all_dates_raw],
                "cumulative": aashima_cum
            },
            "last_updated": datetime.now().isoformat()
        }

        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Cache updated successfully")
        return cache_data
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error fetching tasks: {e}")
        return None

def load_cache():
    """Load cached data from JSON file"""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cache: {e}")
    return None

def cache_refresh_worker():
    """Background worker that refreshes cache periodically"""
    while True:
        time.sleep(CACHE_REFRESH_INTERVAL)
        fetch_and_cache_tasks()

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/task_counts")
def task_counts():
    # loading cache first
    cache_data = load_cache()
    
    if cache_data:
        return jsonify(cache_data)
    
    cache_data = fetch_and_cache_tasks()
    if cache_data:
        return jsonify(cache_data)
    
    #fallback
    return jsonify({"error": "Failed to fetch task data"}), 500

if __name__ == "__main__":
    # populating w cache
    fetch_and_cache_tasks()
    
    # background refresh
    refresh_thread = threading.Thread(target=cache_refresh_worker, daemon=True)
    refresh_thread.start()
    
    app.run(debug=True)