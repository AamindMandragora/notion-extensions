from flask import Flask, jsonify, send_from_directory
from notion import winter_break_tasks

app = Flask(__name__)

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/api/winter_break_scores")
def task_counts():
    scores = winter_break_tasks()

    return jsonify({
        "aashima": len(scores[0]),
        "adi": len(scores[1])
    })

if __name__ == "__main__":
    app.run(debug=True)