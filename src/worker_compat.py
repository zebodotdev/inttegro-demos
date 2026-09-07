"""Narrow ASGI compatibility for Django in a single-threaded Python Worker.

Django's ASGI handler uses ``asgiref.sync.sync_to_async`` even when an
application's own views are fully asynchronous (for example, to close an
``HttpResponse``). The default adapter delegates that small synchronous hook to
a thread pool. Python Workers intentionally do not provide OS threads.

This demo has no ORM, synchronous network calls, or other blocking work. At the
Worker boundary only, the adapter below therefore runs Django's short
synchronous framework hooks inline on the event-loop thread. Do not carry this
shim into an application that depends on thread isolation or blocking I/O. For
those applications, use Django's WSGI path and a Worker-compatible storage
backend, or deploy the ordinary ASGI application in a container.
"""

from functools import wraps
from typing import Any, Callable


def _inline_sync_to_async(
    function: Callable[..., Any] | None = None,
    *,
    thread_sensitive: bool = True,
    executor: Any = None,
    context: Any = None,
):
    """Return an awaitable wrapper that performs a known-fast call inline."""

    del thread_sensitive, executor, context

    def decorate(callable_: Callable[..., Any]):
        @wraps(callable_)
        async def invoke(*args: Any, **kwargs: Any) -> Any:
            return callable_(*args, **kwargs)

        return invoke

    return decorate if function is None else decorate(function)


def install_django_asgi_worker_compatibility() -> None:
    """Install the shim before any Django module captures sync_to_async."""

    import asgiref.sync

    asgiref.sync.sync_to_async = _inline_sync_to_async
