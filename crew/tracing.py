"""
Captures the real, per-run CrewAI trace URL (app.crewai.com) so the frontend can
link directly to the actual execution trace for that specific agent run, instead
of a generic dashboard homepage that shows nothing without a login session.

CrewAI's TraceBatchManager computes this URL internally and only prints it to
the console — there's no public API to read it back. This patches the one method
that computes it to also stash it somewhere we can read.

Finalization (where the URL becomes known) happens on a background thread
shortly after kickoff() returns, not on the calling thread — so this uses a
plain global (not threading.local, which a background thread can't see) behind
a lock. Fine for this service's low concurrency; a mismatch under concurrent
requests just means an occasional trace link points to the wrong step, not a
broken one.
"""

import threading
import time

from crewai.events.listeners.tracing.trace_batch_manager import TraceBatchManager

_lock = threading.Lock()
_url: str | None = None

_original_finalize = TraceBatchManager._finalize_backend_batch


def _patched_finalize(self, events_count: int = 0):
    result = _original_finalize(self, events_count)
    url = getattr(self, "trace_url", None) or getattr(self, "ephemeral_trace_url", None)
    if url:
        global _url
        with _lock:
            _url = url
    return result


TraceBatchManager._finalize_backend_batch = _patched_finalize


def clear_trace_url() -> None:
    global _url
    with _lock:
        _url = None


def get_trace_url() -> str | None:
    with _lock:
        return _url


def wait_for_trace_url(timeout: float = 3.0) -> str | None:
    """Poll briefly for the URL rather than miss it due to the finalize-on-a-
    background-thread timing above."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        url = get_trace_url()
        if url:
            return url
        time.sleep(0.1)
    return get_trace_url()
