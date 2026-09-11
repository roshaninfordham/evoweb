import os

from crewai import LLM

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "deepseek-ai/deepseek-v4-flash-0731"

# A persistent Daytona sandbox, pre-provisioned with TypeScript, reused across
# every verification. Created once via the One CLI directly (see project notes) —
# avoids a fresh sandbox-creation-and-setup round trip (which took 6+ minutes of
# trial and error the first time) on every single evolution.
DAYTONA_SANDBOX_ID = "a34bb369-f931-4523-abcf-d3decb01c418"
DAYTONA_EXEC_ACTION_ID = "conn_mod_def::GNF5XuTz34A::sxtFNI_cQICzppPkTCzHLg"
DAYTONA_CONNECTION_KEY = "live::daytona::default::2615bc602a3b4d37aa73a3a933817218"


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _nvidia_llm(temperature: float) -> LLM:
    return LLM(
        model=f"openai/{NVIDIA_MODEL}",
        base_url=NVIDIA_BASE_URL,
        api_key=require_env("NVIDIA_API_KEY"),
        temperature=temperature,
    )


def planner_llm() -> LLM:
    return _nvidia_llm(temperature=0.3)


def builder_llm() -> LLM:
    return _nvidia_llm(temperature=0.2)
