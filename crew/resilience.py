"""
NVIDIA NIM has proven unpredictable under load — the same trivial call has taken
anywhere from ~1s to several *minutes*, and once caused a live SSE stream to be
killed outright. A live demo cannot tolerate an unbounded hang on any LLM call.

This wraps a crew.kickoff() (or any blocking call) with a hard wall-clock
timeout, returning a caller-supplied fallback instead of hanging. The
fallback is always something honestly derivable from real data already in
hand — never a fabricated result presented as if the model produced it.
"""

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import Callable, TypeVar

T = TypeVar("T")

_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="llm-call")


def with_timeout(fn: Callable[[], T], timeout: float, fallback: T) -> T:
    future = _executor.submit(fn)
    try:
        return future.result(timeout=timeout)
    except FutureTimeoutError:
        return fallback
    except Exception:  # noqa: BLE001 — any LLM/tool failure also falls back, never hangs or 500s
        return fallback


def with_timeout_or_raise(fn: Callable[[], T], timeout: float) -> T:
    """For calls with no safe fallback (e.g. Builder — there's no honest stand-in
    for real generated code). Fails fast and loud instead of hanging for minutes."""
    future = _executor.submit(fn)
    try:
        return future.result(timeout=timeout)
    except FutureTimeoutError as err:
        raise TimeoutError(f"LLM call timed out after {timeout}s") from err
