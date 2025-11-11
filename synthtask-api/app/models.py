"""
Pydantic models for the Sintask API
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: int
    email: str
    name: str


class TrelloConfig(BaseModel):
    trello_api_key: str
    trello_token: str
    trello_list_id: str


class MeetingText(BaseModel):
    text: str


class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    priority: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class ProcessedMeeting(BaseModel):
    id: str
    summary: str
    key_points: List[str]
    tasks: List[Task]
    created_at: str
    sent_to_trello: bool = False


class TaskUpdate(BaseModel):
    title: str
    description: str
    priority: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class SendToTrelloRequest(BaseModel):
    meeting_id: str
    task_ids: List[str]


class AuthResponse(BaseModel):
    token: str
    user: User


class MessageResponse(BaseModel):
    message: str


class TrelloCardResponse(BaseModel):
    task_id: str
    card_id: str
    card_url: str
    card_name: str


class SendToTrelloResponse(BaseModel):
    message: str
    cards: List[TrelloCardResponse]