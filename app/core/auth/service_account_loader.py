import yaml
from pathlib import Path
from typing import Dict, List, Optional

# Path to service_accounts.yaml (same folder)
ACCOUNTS_PATH = Path(__file__).parent / "service_accounts.yaml"


def load_service_accounts() -> Dict[str, Dict]:
    """
    Loads service account definitions from service_accounts.yaml.
    Returns a dict:
        {
          "orchestrator": { "scopes": ["agent.invoke", ...] },
          ...
        }
    """
    if not ACCOUNTS_PATH.exists():
        return {}

    with open(ACCOUNTS_PATH, "r") as f:
        data = yaml.safe_load(f) or {}

    # Ensure structure always has "scopes"
    for name, config in data.items():
        if "scopes" not in config:
            config["scopes"] = []

    return data


def get_scopes_for(service_name: str) -> List[str]:
    """
    Returns the list of scopes assigned to a service.
    If service not found → returns empty list.
    """
    accounts = load_service_accounts()
    entry = accounts.get(service_name, {})
    return entry.get("scopes", [])


def service_exists(service_name: str) -> bool:
    """
    Returns True if the service account exists in the YAML file.
    """
    accounts = load_service_accounts()
    return service_name in accounts


def list_services() -> List[str]:
    """
    Returns the list of all defined internal services.
    """
    accounts = load_service_accounts()
    return list(accounts.keys())
