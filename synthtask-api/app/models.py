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



class MeetingText(BaseModel):
    text: str


class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class ProcessedMeeting(BaseModel):
    id: str
    tasks: List[Task]
    created_at: str
    sent: bool = False


class TaskUpdate(BaseModel):
    title: str
    description: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None



class AuthResponse(BaseModel):
    token: str
    user: User


class MessageResponse(BaseModel):
    message: str



class ProjectCreate(BaseModel):
    name: str
    provider: str
    target_id: str
    target_name: Optional[str] = None

class Project(BaseModel):
    id: int
    name: str
    provider: str
    target_id: str
    target_name: Optional[str] = None
    created_at: str

class ProjectCreate(BaseModel):
    name: str
    provider: str
    target_id: str
    target_name: Optional[str] = None

class Project(BaseModel):
    id: int
    name: str
    provider: str
    target_id: str
    target_name: Optional[str] = None
    created_at: str
