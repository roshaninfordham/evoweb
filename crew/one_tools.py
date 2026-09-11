import subprocess

from crewai.tools import tool

ONE_TIMEOUT = 60


def _run_one(*args: str) -> str:
    try:
        result = subprocess.run(
            ["one", "--agent", *args],
            capture_output=True,
            text=True,
            timeout=ONE_TIMEOUT,
        )
        return (result.stdout or "").strip() or (result.stderr or "").strip()
    except Exception as err:  # noqa: BLE001
        return f"one CLI call failed: {err}"


@tool("List One connections")
def list_one_connections() -> str:
    """List platforms currently connected through One, with their connection keys.
    Call this first to find the exact connection key for a platform before executing an action."""
    return _run_one("connection", "list")


@tool("Search One actions")
def search_one_actions(platform: str, query: str) -> str:
    """Search for actions available on a connected One platform.
    platform is a One platform slug (e.g. 'you', 'daytona'). query is natural language
    describing what you want to do (e.g. 'search the web', 'create a sandbox')."""
    return _run_one("actions", "search", platform, query, "-t", "execute")


@tool("Get One action knowledge")
def get_one_action_knowledge(platform: str, action_id: str) -> str:
    """Get the full request/response documentation for one specific action.
    ALWAYS call this before execute_one_action so you know the exact parameters it expects."""
    return _run_one("actions", "knowledge", platform, action_id)


@tool("Execute One action")
def execute_one_action(
    platform: str,
    action_id: str,
    connection_key: str,
    path_vars_json: str = "{}",
    query_params_json: str = "{}",
    data_json: str = "{}",
) -> str:
    """Execute a real action on a connected One platform. The knowledge doc for the action tells you
    exactly which parameters are path variables, query parameters, or body fields — map them accordingly:
    - path_vars_json: JSON object for URL placeholders, e.g. '{"sandboxId": "abc123"}'
    - query_params_json: JSON object for query-string parameters, e.g. '{"path": "/file.txt"}'
    - data_json: JSON object for the POST/PUT/PATCH request body, e.g. '{"content": "..."}'
    Omit (leave as '{}') whichever ones the action doesn't need. Getting a parameter's placement wrong
    (e.g. a path variable put in the body) causes a validation error — read the knowledge doc carefully."""
    return _run_one(
        "actions",
        "execute",
        platform,
        action_id,
        connection_key,
        "--path-vars",
        path_vars_json,
        "--query-params",
        query_params_json,
        "-d",
        data_json,
    )


ONE_TOOLS = [list_one_connections, search_one_actions, get_one_action_knowledge, execute_one_action]
