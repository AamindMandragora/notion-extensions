from flask import Flask, jsonify, send_from_directory
from notion import fetch_tasks
from collections import defaultdict
from datetime import datetime, timedelta
import json
import os
import threading
import time

app = Flask(__name__, static_folder="static")

CACHE_FILE = "task_cache.json"
CACHE_REFRESH_INTERVAL = 300

def aggregate_daily(person, tasks):
    """Return dict date -> count of tasks for given list of tasks"""
    daily_counts = defaultdict(int)
    for task in tasks:
        try:
            if person == "adi":
                date_str = task["properties"]['Scheduled Date']["date"]["start"]
            elif person == "aashima":
                date_str = task["properties"]["date estimated"]["date"]
                if not date_str:
                    date_str = task["properties"]["date due"]["date"]
                date_str = date_str["start"]
            date_obj = datetime.fromisoformat(date_str).date()
            daily_counts[date_obj.isoformat()] += 1
        except (KeyError, TypeError):
            continue
    return daily_counts

def fetch_and_cache_all_data():
    """Fetch all task data and cache both winter break and heatmap data"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Fetching all tasks from Notion...")
    try:
        adi_all_tasks = fetch_tasks("adi", None)
        aashima_all_tasks = fetch_tasks("aashima", None)
        
        adi_winter_tasks = fetch_tasks("adi", "winter_break")
        aashima_winter_tasks = fetch_tasks("aashima", "winter_break")

        adi_daily_winter = aggregate_daily("adi", adi_winter_tasks)
        aashima_daily_winter = aggregate_daily("aashima", aashima_winter_tasks)

        all_dates_raw = sorted(set(adi_daily_winter) | set(aashima_daily_winter))
        all_dates = [datetime.fromisoformat(d).strftime("%b %d") for d in all_dates_raw]

        adi_cum, aashima_cum = [], []
        cum_adi = cum_aashima = 0
        for d_raw in all_dates_raw:
            cum_adi += adi_daily_winter.get(d_raw, 0)
            cum_aashima += aashima_daily_winter.get(d_raw, 0)
            adi_cum.append(cum_adi)
            aashima_cum.append(cum_aashima)

        one_year_ago = (datetime.now() - timedelta(days=365)).date()
        
        adi_daily_all = aggregate_daily("adi", adi_all_tasks)
        aashima_daily_all = aggregate_daily("aashima", aashima_all_tasks)
        
        heatmap_dates = []
        current_date = one_year_ago
        today = datetime.now().date()
        
        while current_date <= today:
            heatmap_dates.append({
                "date": current_date.isoformat(),
                "adi": adi_daily_all.get(current_date.isoformat(), 0),
                "aashima": aashima_daily_all.get(current_date.isoformat(), 0)
            })
            current_date += timedelta(days=1)

        cache_data = {
            "winter_break": {
                "dates": all_dates,
                "adi": {
                    "daily": [adi_daily_winter.get(d, 0) for d in all_dates_raw],
                    "cumulative": adi_cum
                },
                "aashima": {
                    "daily": [aashima_daily_winter.get(d, 0) for d in all_dates_raw],
                    "cumulative": aashima_cum
                }
            },
            "heatmap": {
                "dates": heatmap_dates,
                "start_date": one_year_ago.isoformat(),
                "end_date": today.isoformat()
            },
            "last_updated": datetime.now().isoformat()
        }

        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Cache updated successfully")
        return cache_data
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error fetching tasks: {e}")
        import traceback
        traceback.print_exc()
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
        fetch_and_cache_all_data()

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/task_counts")
def task_counts():
    """Return winter break task counts from cache"""
    cache_data = load_cache()
    
    if cache_data and "winter_break" in cache_data:
        return jsonify(cache_data["winter_break"])
    
    cache_data = fetch_and_cache_all_data()
    if cache_data and "winter_break" in cache_data:
        return jsonify(cache_data["winter_break"])
    
    return jsonify({"error": "Failed to fetch task data"}), 500

@app.route("/api/heatmap")
def heatmap_data():
    """Return heatmap data from cache"""
    cache_data = load_cache()
    
    if cache_data and "heatmap" in cache_data:
        return jsonify(cache_data["heatmap"])
    
    cache_data = fetch_and_cache_all_data()
    if cache_data and "heatmap" in cache_data:
        return jsonify(cache_data["heatmap"])
    
    return jsonify({"error": "Failed to fetch heatmap data"}), 500

if __name__ == "__main__":
    fetch_and_cache_all_data()
    
    refresh_thread = threading.Thread(target=cache_refresh_worker, daemon=True)
    refresh_thread.start()
    
    app.run(debug=True)