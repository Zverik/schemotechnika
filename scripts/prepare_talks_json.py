#!/usr/bin/env python3
import json
import yaml

data = yaml.safe_load(open('talks.yaml', 'r').read())
with open('talks.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)
