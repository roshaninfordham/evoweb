import os

from crewai import LLM

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "deepseek-ai/deepseek-v4-pro-0813"


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
