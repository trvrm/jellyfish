import json
import pathlib
CONFIG_FILE_PATH=pathlib.Path("jellyfish.json")

def connection_settings():
    keys = {"username", "password", "host", "port", "database", "application_name"}
    with CONFIG_FILE_PATH.open() as f:
        settings = json.load(f)
        assert set(settings.keys()) >= keys
    
    return {key: value for key, value in settings.items() if key in keys}
