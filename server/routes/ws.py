"""
WebSocket Router for Real-time Features

Provides real-time communication for:
- Notifications (instant delivery)
- Case updates (live collaboration)
- System announcements
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, Set, Optional, List
import json
import asyncio
from datetime import datetime

from ..database import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class ConnectionManager:
    """
    Manages WebSocket connections for real-time features.
    
    Supports:
    - User-specific notifications
    - Room-based subscriptions (e.g., case_id)
    - Broadcast to all connected users
    """
    
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # room_id -> set of WebSocket connections (for case updates, etc)
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # WebSocket -> user_id mapping for cleanup
        self.connection_users: Dict[WebSocket, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept connection and register user."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_users[websocket] = user_id
        
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def disconnect(self, websocket: WebSocket):
        """Clean up disconnected connection."""
        user_id = self.connection_users.get(websocket)
        
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remove from any rooms
        for room_connections in self.rooms.values():
            room_connections.discard(websocket)
        
        if websocket in self.connection_users:
            del self.connection_users[websocket]
    
    async def join_room(self, websocket: WebSocket, room_id: str):
        """Join a room for targeted updates."""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)
    
    async def leave_room(self, websocket: WebSocket, room_id: str):
        """Leave a room."""
        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to a specific user (all their connections)."""
        connections = self.active_connections.get(user_id, set())
        dead_connections = set()
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.disconnect(conn)
    
    async def send_to_room(self, room_id: str, message: dict, exclude: Optional[WebSocket] = None):
        """Send message to all users in a room."""
        connections = self.rooms.get(room_id, set())
        dead_connections = set()
        
        for connection in connections:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.add(connection)
        
        for conn in dead_connections:
            self.disconnect(conn)
    
    async def broadcast(self, message: dict):
        """Broadcast to all connected users."""
        for user_id, connections in list(self.active_connections.items()):
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection)
    
    def get_online_users(self) -> List[str]:
        """Get list of online user IDs."""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is online."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


# Global connection manager instance
manager = ConnectionManager()


def verify_token(token: str) -> Optional[str]:
    """
    Verify JWT token and return user_id.
    Simplified for WebSocket context.
    """
    if not token:
        return None
    
    try:
        from jose import jwt
        from ..config import settings
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        
        if email:
            # Return a user identifier (could be email or fetch actual user_id)
            return f"user-{email}"
        return None
    except Exception:
        return None


@router.websocket("/ws/notifications")
async def notifications_websocket(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for user notifications.
    
    Connect with: ws://host/api/ws/notifications?token=<jwt>
    
    Receives:
    - type: "notification" - New notification
    - type: "unread_count" - Updated unread count
    """
    # Verify token
    user_id = verify_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            # Handle client commands
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif data.get("type") == "mark_read":
                # Client marked notification as read
                await websocket.send_json({
                    "type": "ack",
                    "action": "mark_read",
                    "id": data.get("id")
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/case/{case_id}")
async def case_websocket(
    websocket: WebSocket,
    case_id: str,
    token: str = Query(...)
):
    """
    WebSocket endpoint for case collaboration.
    
    Connect with: ws://host/api/ws/case/{case_id}?token=<jwt>
    
    Receives:
    - type: "comment" - New comment
    - type: "update" - Case was updated
    - type: "user_joined" - User joined viewing
    - type: "user_left" - User left
    """
    user_id = verify_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    await manager.connect(websocket, user_id)
    await manager.join_room(f"case-{case_id}", websocket)
    
    # Notify room that user joined
    await manager.send_to_room(f"case-{case_id}", {
        "type": "user_joined",
        "user_id": user_id,
        "case_id": case_id,
        "timestamp": datetime.utcnow().isoformat()
    }, exclude=websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif data.get("type") == "comment":
                # Broadcast comment to room
                await manager.send_to_room(f"case-{case_id}", {
                    "type": "comment",
                    "user_id": user_id,
                    "case_id": case_id,
                    "content": data.get("content"),
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif data.get("type") == "typing":
                # Broadcast typing indicator
                await manager.send_to_room(f"case-{case_id}", {
                    "type": "typing",
                    "user_id": user_id
                }, exclude=websocket)
    
    except WebSocketDisconnect:
        await manager.leave_room(websocket, f"case-{case_id}")
        await manager.send_to_room(f"case-{case_id}", {
            "type": "user_left",
            "user_id": user_id,
            "case_id": case_id
        })
        manager.disconnect(websocket)


# --- Helper functions for other modules ---

async def send_notification(user_id: str, notification: dict):
    """
    Send a real-time notification to a user.
    Call this from other parts of the app when creating notifications.
    """
    await manager.send_to_user(user_id, {
        "type": "notification",
        "notification": notification,
        "timestamp": datetime.utcnow().isoformat()
    })


async def broadcast_case_update(case_id: str, update: dict, exclude_user: Optional[str] = None):
    """
    Broadcast a case update to all viewers.
    """
    await manager.send_to_room(f"case-{case_id}", {
        "type": "update",
        "case_id": case_id,
        "update": update,
        "timestamp": datetime.utcnow().isoformat()
    })


async def broadcast_system_message(message: str, level: str = "info"):
    """
    Broadcast a system message to all connected users.
    """
    await manager.broadcast({
        "type": "system",
        "message": message,
        "level": level,
        "timestamp": datetime.utcnow().isoformat()
    })
