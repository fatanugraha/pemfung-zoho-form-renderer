import json

data = json.load(open("fixture.json", "r"))

result = []
for section in data["sections"]:
    for field in section["fields"]:
        if field["data_type"] != "pick_list":
            continue
        values = field["pick_list_values"]
        for value in values:
            if "maps" in value:
                cur = {
                    "conditions": {
                        "func": "is",
                        "args": [
                            {"field": field["api_name"]},
                            {"value": value["actual_value"]},
                        ],
                    },
                    'fulfilled': [],
                    'rejected': [],
                }

                for map in value["maps"]:
                    for map_values in map['pick_list_values']:

                result.append(cur)
