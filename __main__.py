import os
from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

notion = Client(auth=os.getenv("INTEGRATION_SECRET"))

TASK_DATABASES = {
    "adi" : os.getenv("ADI_DATABASE"),
    "aashima" : os.getenv("AASHIMA_DATABASE")
}

def fetch_tasks(person: "adi" | "aashima"): # type: ignore
    tasks = []
    db_id = TASK_DATABASES[person]
    database = notion.databases.retrieve(database_id=db_id)
    for source_ref in database['data_sources']:
        source = notion.data_sources.query(data_source_id=source_ref['id'])
        while (source['next_cursor'] != None):
            tasks += source['results']
            source = notion.data_sources.query(data_source_id=source_ref['id'], start_cursor=source['next_cursor'])
        tasks += source['results']
    return tasks

if __name__ == "__main__":
    aashima_tasks = fetch_tasks("aashima")
    adi_tasks = fetch_tasks("adi")
    print(len(aashima_tasks))
    print(len(adi_tasks))