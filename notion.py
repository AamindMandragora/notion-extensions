import os
from dotenv import load_dotenv
from notion_client import Client
from collections import defaultdict
from datetime import datetime, date, timezone

load_dotenv()

notion = Client(auth=os.getenv("INTEGRATION_SECRET"))

TASK_DATABASES = {
    "adi": {
        "db_id": os.getenv("ADI_DATABASE"),
        "filters": {
            "winter_break": {
                "and": [
                    {
                        "property": "Task Type",
                        "status": {"equals": "Done"},
                    },
                    {
                        "property": "Scheduled Date",
                        "date": {"after": "2025-12-16"},
                    },
                ]
            },
            "completed": {
                "property": "Task Type",
                "status": {"equals": "Done"},
            }
        },
    },
    "aashima": {
        "db_id": os.getenv("AASHIMA_DATABASE"),
        "filters": {
            "winter_break": {
                "and": [
                    {
                        "property": "status",
                        "status": {"equals": "Done"},
                    },
                    {
                        "or": [
                            {
                                "property": "date due",
                                "date": {"after": "2025-12-16"},
                            },
                            {
                                "property": "date estimated",
                                "date": {"after": "2025-12-16"},
                            },
                        ]
                    },
                ]
            },
            "completed": {
                "property": "status",
                "status": {"equals": "Done"},
            }
        },
    },
}
HABITS_SOURCE = os.getenv("HABITS_SOURCE")

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

def fetch_tasks(person: str, filter_name: str | None = None):
    tasks = []

    config = TASK_DATABASES[person]
    db_id = config["db_id"]
    filter_obj = (
        config["filters"].get(filter_name) if filter_name else None
    )

    database = notion.databases.retrieve(database_id=db_id)

    for source_ref in database["data_sources"]:
        query_args = {
            "data_source_id": source_ref["id"],
        }

        if filter_obj:
            query_args["filter"] = filter_obj

        source = notion.data_sources.query(**query_args)

        while True:
            tasks.extend(source["results"])

            if not source["has_more"]:
                break

            query_args["start_cursor"] = source["next_cursor"]
            source = notion.data_sources.query(**query_args)

    return tasks

def winter_break_tasks():
    aashima_tasks = fetch_tasks("aashima", "winter_break")
    adi_tasks = fetch_tasks("adi", "winter_break")
    return [aashima_tasks, adi_tasks]

def read_habits_today():
    today = date.today().isoformat()

    result = {
        "date": today,
        "adi": 0,
        "aashima": 0,
    }

    query = notion.data_sources.query(data_source_id=HABITS_SOURCE)
    pages = query["results"]

    for page in pages:
        props = page["properties"]
        try:
            name = props["Name"]["title"][0]["plain_text"]
            total = props["Total"]["formula"]["number"]
        except (KeyError, IndexError, TypeError):
            continue

        if name.lower() == "adi":
            result["adi"] = total
        elif name.lower() == "aashima":
            result["aashima"] = total

    return result

def uncheck_all_habits():
    query = notion.data_sources.query(data_source_id=HABITS_SOURCE)
    pages = query["results"]

    for page in pages:
        page_id = page["id"]
        props = page["properties"]

        updates = {}
        for prop_name, prop_val in props.items():
            if prop_val["type"] == "checkbox":
                updates[prop_name] = {"checkbox": False}

        if not updates:
            continue

        notion.pages.update(page_id=page_id, properties=updates)

if __name__ == "__main__":
    print(read_habits_today())
    uncheck_all_habits()