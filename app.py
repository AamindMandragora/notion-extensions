from flask import Flask, request, jsonify, send_from_directory
from notion import *
from datetime import datetime, timedelta
import redis
import json
import os
import threading

app = Flask(__name__, static_folder="static")

REDIS_URL = os.getenv("REDIS_URL")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def rebuild_cache():
    data = build_cache_payload()
    set_cached("summer_2026", data["summer_2026"])
    set_cached("heatmap", data["heatmap"])

def rebuild_cache_safe():
    try:
        rebuild_cache()
    except Exception as e:
        print(f"Cache rebuild failed: {e}")

def build_cache_payload():
    one_year_ago = (datetime.now() - timedelta(days=364)).date()
    one_year_ago_str = one_year_ago.isoformat()

    adi_all = fetch_tasks("adi", filter_obj=heatmap_filter("adi", one_year_ago_str))
    aashima_all = fetch_tasks("aashima", filter_obj=heatmap_filter("aashima", one_year_ago_str))

    adi_summer_2026 = fetch_tasks("adi", "summer_2026")
    aashima_summer_2026 = fetch_tasks("aashima", "summer_2026")

    adi_summer_2026_daily = aggregate_daily("adi", adi_summer_2026)
    aashima_summer_2026_daily = aggregate_daily("aashima", aashima_summer_2026)

    all_dates = sorted(set(adi_summer_2026_daily) | set(aashima_summer_2026_daily))

    adi_cum, aashima_cum = [], []
    c1 = c2 = 0
    for d in all_dates:
        c1 += adi_summer_2026_daily.get(d, 0)
        c2 += aashima_summer_2026_daily.get(d, 0)
        adi_cum.append(c1)
        aashima_cum.append(c2)

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
        "summer_2026": {
            "dates": [datetime.fromisoformat(d).strftime("%b %d") for d in all_dates],
            "adi": {
                "daily": [adi_summer_2026_daily.get(d, 0) for d in all_dates],
                "cumulative": adi_cum
            },
            "aashima": {
                "daily": [aashima_summer_2026_daily.get(d, 0) for d in all_dates],
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

def build_weekly_habit_consistency():
    data = get_cached("habits") or []
    if not data:
        return []

    TOTAL_HABITS = 5
    last_7 = data[-7:]

    result = []
    for d in last_7:
        result.append({
            "date": d["date"],
            "adi": round(d["adi"] / TOTAL_HABITS, 3),
            "aashima": round(d["aashima"] / TOTAL_HABITS, 3),
        })

    return result

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/task_counts")
def task_counts():
    cached = get_cached("summer_2026")
    if cached:
        return jsonify(cached)

    rebuild_cache()
    return jsonify(get_cached("summer_2026"))

@app.route("/api/heatmap")
def heatmap():
    cached = get_cached("heatmap")
    if cached:
        return jsonify(cached)

    rebuild_cache()
    return jsonify(get_cached("heatmap"))

@app.route("/api/habits/weekly")
def weekly_habits():
    data = build_weekly_habit_consistency()
    return jsonify(data)

@app.route("/notion-webhook", methods=["POST"])
def recieve_webhook():
    payload = request.get_json(silent=True) or {}

    if payload.get("verification_token"):
        return "", 200

    try:
        redis_client.delete("summer_2026", "heatmap")
    except Exception as e:
        print(f"Cache invalidation failed: {e}")

    threading.Thread(target=rebuild_cache_safe, daemon=True).start()
    return "", 200

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
    print(build_weekly_habit_consistency())
    app.run(debug=True)