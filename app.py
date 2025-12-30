from flask import Flask, jsonify, send_from_directory
from notion import fetch_tasks
from collections import defaultdict
from datetime import datetime

app = Flask(__name__, static_folder="static")

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

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/task_counts")
def task_counts():
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

    return jsonify({
        "dates": all_dates,
        "adi": {
            "daily": [adi_daily.get(d, 0) for d in all_dates_raw],
            "cumulative": adi_cum
        },
        "aashima": {
            "daily": [aashima_daily.get(d, 0) for d in all_dates_raw],
            "cumulative": aashima_cum
        }
    })

if __name__ == "__main__":
    app.run(debug=True)