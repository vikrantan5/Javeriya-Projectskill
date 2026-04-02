from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, Depends
from app.database import get_db
from app.utils.auth import decode_access_token, get_current_user
from datetime import datetime, timezone
from typing import Dict
import logging
import uuid
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/realtime", tags=["Realtime"])


class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_key: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_key not in self.rooms:
            self.rooms[room_key] = {}
        self.rooms[room_key][user_id] = websocket

    def disconnect(self, room_key: str, user_id: str):
        room = self.rooms.get(room_key, {})
        if user_id in room:
            del room[user_id]
        if not room and room_key in self.rooms:
            del self.rooms[room_key]

    async def broadcast(self, room_key: str, message: dict):
        room = self.rooms.get(room_key, {})
        stale_users = []

        for uid, connection in room.items():
            try:
                await connection.send_json(message)
            except Exception:
                stale_users.append(uid)

        for uid in stale_users:
            self.disconnect(room_key, uid)


manager = ConnectionManager()


def _validate_room_type(room_type: str):
      if room_type not in ["task", "session", "exchange"]:
        raise HTTPException(status_code=400, detail="room_type must be 'task', 'session', or 'exchange'")


def _room_key(room_type: str, room_id: str) -> str:
    return f"{room_type}:{room_id}"


def _persist_message(message_payload: dict):
    db = get_db()
    db.table("realtime_messages").insert(message_payload).execute()


@router.get("/history/{room_type}/{room_id}")
async def get_realtime_history(
    room_type: str,
    room_id: str,
    limit: int = 100,
    current_user_id: str = Depends(get_current_user),
):
    _validate_room_type(room_type)
    try:
        db = get_db()
        result = (
            db.table("realtime_messages")
            .select("*")
            .eq("room_type", room_type)
            .eq("room_id", room_id)
            .order("created_at", desc=False)
            .limit(max(1, min(limit, 200)))
            .execute()
        )

        return {
            "room_type": room_type,
            "room_id": room_id,
            "requester_id": current_user_id,
            "messages": result.data or [],
        }
    except Exception as e:
        err_text = str(e).lower()
        if "realtime_messages" in err_text and "does not exist" in err_text:
            return {
                "room_type": room_type,
                "room_id": room_id,
                "requester_id": current_user_id,
                "messages": [],
                "note": "Run realtime chat migration SQL to persist messages.",
            }
        logger.error(f"Error fetching realtime history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{room_type}/{room_id}")
async def realtime_ws(websocket: WebSocket, room_type: str, room_id: str, token: str = Query(...)):
      # Accept the WebSocket connection FIRST before any validation
    await websocket.accept()
    try:
        token_data = decode_access_token(token)
        user_id = token_data.user_id
        if not user_id:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    if room_type not in ["task", "session", "exchange"]:
        await websocket.close(code=1003)
        return

    key = _room_key(room_type, room_id)
     # Add user to the room (no need to accept again, already accepted above)
    if key not in manager.rooms:
        manager.rooms[key] = {}
    manager.rooms[key][user_id] = websocket

    join_event = {
        "id": str(uuid.uuid4()),
        "room_type": room_type,
        "room_id": room_id,
        "sender_id": user_id,
        "message_type": "system",
        "content": "joined",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await manager.broadcast(key, join_event)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
            except json.JSONDecodeError:
                payload = {"content": raw_data}

            content = str(payload.get("content") or "").strip()
            if not content:
                await websocket.send_json({"event": "error", "detail": "Message cannot be empty"})
                continue

            message_payload = {
                "id": str(uuid.uuid4()),
                "room_type": room_type,
                "room_id": room_id,
                "sender_id": user_id,
                "message_type": payload.get("message_type", "text"),
                "content": content,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

            try:
                _persist_message(message_payload)
            except Exception as e:
                logger.warning(f"Realtime message not persisted: {str(e)}")

            await manager.broadcast(key, message_payload)

    except WebSocketDisconnect:
        manager.disconnect(key, user_id)
        leave_event = {
            "id": str(uuid.uuid4()),
            "room_type": room_type,
            "room_id": room_id,
            "sender_id": user_id,
            "message_type": "system",
            "content": "left",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await manager.broadcast(key, leave_event)