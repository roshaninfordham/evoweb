import os

from crewai import LLM

ONE_MCP_URL = "https://mcp.withone.ai/mcp"

PLANNER_MODEL = "anthropic/claude-haiku-4-5-20251001"
BUILDER_MODEL = "anthropic/claude-sonnet-5"


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def planner_llm() -> LLM:
    return LLM(model=PLANNER_MODEL, api_key=require_env("ANTHROPIC_API_KEY"), temperature=0.3)


def builder_llm() -> LLM:
    return LLM(model=BUILDER_MODEL, api_key=require_env("ANTHROPIC_API_KEY"), temperature=0.2)


def one_mcp_server_params() -> dict:
    return {
        "url": ONE_MCP_URL,
        "transport": "streamable-http",
        "headers": {"Authorization": f"Bearer {require_env('ONE_API_KEY')}"},
    }
