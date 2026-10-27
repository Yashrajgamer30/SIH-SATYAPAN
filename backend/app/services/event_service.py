import asyncio
import json
from typing import Dict, Set, Optional, AsyncGenerator
from datetime import datetime


class EventBroadcaster:
    def __init__(self):
        # Maps user_id -> Set of asyncio.Queue
        self._listeners: Dict[str, Set[asyncio.Queue]] = {}
        # Broadcast listeners for all officials
        self._global_listeners: Set[asyncio.Queue] = set()

    def subscribe(self, user_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        if user_id not in self._listeners:
            self._listeners[user_id] = set()
        self._listeners[user_id].add(q)
        return q

    def unsubscribe(self, user_id: str, q: asyncio.Queue):
        if user_id in self._listeners:
            self._listeners[user_id].discard(q)
            if not self._listeners[user_id]:
                del self._listeners[user_id]

    async def publish_to_user(self, user_id: str, event_type: str, data: dict):
        if user_id in self._listeners:
            payload = {
                "event": event_type,
                "data": json.dumps({
                    "type": event_type,
                    "payload": data,
                    "timestamp": datetime.utcnow().isoformat()
                })
            }
            for q in list(self._listeners[user_id]):
                await q.put(payload)

    async def broadcast(self, event_type: str, data: dict):
        payload = {
            "event": event_type,
            "data": json.dumps({
                "type": event_type,
                "payload": data,
                "timestamp": datetime.utcnow().isoformat()
            })
        }
        for user_queues in self._listeners.values():
            for q in list(user_queues):
                await q.put(payload)


event_broadcaster = EventBroadcaster()


async def user_event_generator(user_id: str) -> AsyncGenerator[dict, None]:
    """
    Yields real-time events for the connected user.
    Includes initial connection ack and periodic 15s heartbeats.
    """
    queue = event_broadcaster.subscribe(user_id)
    try:
        # Initial greeting event
        yield {
            "event": "connected",
            "data": json.dumps({
                "status": "connected",
                "user_id": user_id,
                "notice": "AICTE SATYAPAN Live Event Stream Active",
                "timestamp": datetime.utcnow().isoformat()
            })
        }

        while True:
            try:
                # Wait for next event or send heartbeat after 15 seconds
                message = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield message
            except asyncio.TimeoutError:
                # Heartbeat ping
                yield {
                    "event": "heartbeat",
                    "data": json.dumps({
                        "ping": "keep-alive",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                }
    finally:
        event_broadcaster.unsubscribe(user_id, queue)
