#!/usr/bin/env python3
import json
import yaml


def validate(schemo):
    err_count = 0

    def err(msg):
        nonlocal err_count
        print(msg)
        err_count += 1

    NAMES = {'name', 'name_en'}
    for cx in schemo:
        c = cx.get('cx', '?')
        for k in ('title', 'title_en', 'date', 'url', 'venue', 'talks'):
            if k not in cx:
                err(f'No {k} in cx {c}')
        if NAMES - cx.get('venue', {}).keys():
            err(f'No name/name_en for the venue in cx {c}')
        for i, talk in enumerate(cx['talks'], 1):
            for k in ('speakers', 'title', 'title_en'):
                if k not in talk:
                    err(f'No {k} in talk {i} for cx {c}')
            for sp in talk['speakers']:
                if NAMES - sp.keys():
                    err(f'No name/name_en for speaker in talk {i}, cx {c}')
            if 'youtube' in talk and '=' in talk['youtube']:
                err(f'Forgot to remove youtube URL for talk {i} in cx {c}')
            if 'youtube' in talk and 'v_duration' not in talk:
                err(f'No v_duration for talk {i} in cx {c}')
    return err_count


data = yaml.safe_load(open('talks.yaml', 'r').read())
if validate(data) > 0:
    print("Won't overwrite the talks")
else:
    with open('talks.json', 'w') as f:
        json.dump(data, f, ensure_ascii=False)
