#!/usr/bin/env python3
import json
import yaml


class blockseqtrue(list):
    pass


def blockseqtrue_rep(dumper, data):
    return dumper.represent_sequence(u'tag:yaml.org,2002:seq', data, flow_style=True)


if __name__ == '__main__':
    with open('talks.json', 'r') as f:
        schemo = json.load(f)

    for cx in schemo:
        if cx.get('venue', {}).get('lonlat'):
            cx['venue']['lonlat'] = blockseqtrue(cx['venue']['lonlat'])
        for talk in cx['talks']:
            for k in ('tags', 'keywords'):
                if k in talk:
                    talk[k] = blockseqtrue(talk[k])

    yaml.add_representer(blockseqtrue, blockseqtrue_rep)
    with open('talks.yaml', 'w') as f:
        f.write(yaml.dump(schemo, allow_unicode=True, sort_keys=False))
