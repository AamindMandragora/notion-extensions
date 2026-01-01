import os
from dotenv import load_dotenv
from notion_client import Client
from collections import defaultdict
from datetime import datetime, timezone

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

if __name__ == "__main__":
    print(winter_break_tasks())