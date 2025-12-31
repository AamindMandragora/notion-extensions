from flask import Flask, jsonify, send_from_directory
from notion import fetch_tasks
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from threading import Thread
import time
import redis
import json
import os

app = Flask(__name__, static_folder="static")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
LATENCY = 60000

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def parse_notion_date(date_str):
    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    return dt.astimezone(timezone.utc).date().isoformat()

def aggregate_daily(person, tasks):
    daily_counts = defaultdict(int)

    for task in tasks:
        try:
            if person == "adi":
                date_str = task["properties"]["Scheduled Date"]["date"]["start"]
            else:
                date_obj = task["properties"]["date estimated"]["date"] \
                           or task["properties"]["date due"]["date"]
                date_str = date_obj["start"]

            date = parse_notion_date(date_str)
            daily_counts[date] += 1
        except (KeyError, TypeError):
            continue

    return daily_counts

def build_cache_payload():
    adi_all = fetch_tasks("adi", "completed")
    aashima_all = fetch_tasks("aashima", "completed")

    adi_winter = fetch_tasks("adi", "winter_break")
    aashima_winter = fetch_tasks("aashima", "winter_break")

    adi_winter_daily = aggregate_daily("adi", adi_winter)
    aashima_winter_daily = aggregate_daily("aashima", aashima_winter)

    all_dates = sorted(set(adi_winter_daily) | set(aashima_winter_daily))

    adi_cum, aashima_cum = [], []
    c1 = c2 = 0
    for d in all_dates:
        c1 += adi_winter_daily.get(d, 0)
        c2 += aashima_winter_daily.get(d, 0)
        adi_cum.append(c1)
        aashima_cum.append(c2)

    one_year_ago = (datetime.now() - timedelta(days=364)).date()
    today = datetime.now().date()

    adi_all_daily = aggregate_daily("adi", adi_all)
    aashima_all_daily = aggregate_daily("aashima", aashima_all)

    heatmap = []
    cur = one_year_ago
    while cur <= today:
        iso = cur.isoformat()
        heatmap.append({
            "date": iso,
            "adi": adi_all_daily.get(iso, 0),
            "aashima": aashima_all_daily.get(iso, 0),
        })
        cur += timedelta(days=1)

    return {
        "winter_break": {
            "dates": [datetime.fromisoformat(d).strftime("%b %d") for d in all_dates],
            "adi": {
                "daily": [adi_winter_daily.get(d, 0) for d in all_dates],
                "cumulative": adi_cum
            },
            "aashima": {
                "daily": [aashima_winter_daily.get(d, 0) for d in all_dates],
                "cumulative": aashima_cum
            }
        },
        "heatmap": {
            "dates": heatmap,
            "start_date": one_year_ago.isoformat(),
            "end_date": today.isoformat()
        },
        "last_updated": datetime.now().isoformat()
    }


def get_cached(key):
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)
    return None

def set_cached(key, value):
    redis_client.set(key, json.dumps(value))

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/task_counts")
def task_counts():
    cached = get_cached("winter_break")
    if cached:
        return jsonify(cached)

    data = build_cache_payload()
    set_cached("winter_break", data["winter_break"])
    set_cached("heatmap", data["heatmap"])
    return jsonify(data["winter_break"])

@app.route("/api/heatmap")
def heatmap():
    cached = get_cached("heatmap")
    if cached:
        return jsonify(cached)

    data = build_cache_payload()
    set_cached("winter_break", data["winter_break"])
    set_cached("heatmap", data["heatmap"])
    return jsonify(data["heatmap"])

def recache():
    while True:
        print("Rebuilding the cache!")
        data = build_cache_payload()
        set_cached("winter_break", data["winter_break"])
        set_cached("heatmap", data["heatmap"])
        time.sleep(LATENCY)

if __name__ == "__main__":
    rc = Thread(target=recache)
    rc.start()
    app.run(debug=True)