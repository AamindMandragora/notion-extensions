from flask import Flask, request, jsonify, send_from_directory
from notion import *
from datetime import datetime, timedelta
import redis
import json
import os

app = Flask(__name__, static_folder="static")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

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

@app.route("/api/habits")
def habits():
    cached = get_cached("habits")
    if cached:
        return jsonify(cached)
    
    data = []
    set_cached("habits", data)
    return jsonify(data)

@app.route("/api/notion_webhook", methods=["POST"])
def recieve_webhook():
    print("Someone edited the page!")
    print(request.get_json())
    print("Rebuilding the cache!")
    data = build_cache_payload()
    set_cached("winter_break", data["winter_break"])
    set_cached("heatmap", data["heatmap"])
    return "Successful redis update!", 200

@app.route("/api/cron/update_habits")
def update_habits():
    try:
        today_data = read_habits_today()
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        today_data["date"] = yesterday
        data = get_cached("habits") or []
        if not data or data[-1]["date"] != today_data["date"]:
            data.append(today_data)
            set_cached("habits", data)
        uncheck_all_habits()

        return jsonify({"success": True, "added": today_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)