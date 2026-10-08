from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TranscriptSegmentOut(BaseModel):
    id: int
    speaker_name: str
    speaker_color: str
    start_time: float
    end_time: float
    text: str
    class Config:
        from_attributes = True

class ActionItemOut(BaseModel):
    id: int
    meeting_id: int
    assignee: Optional[str] = None
    text: str
    is_completed: bool
    class Config:
        from_attributes = True

class ActionItemCreate(BaseModel):
    text: str
    assignee: Optional[str] = "Unassigned"

class ActionItemUpdate(BaseModel):
    is_completed: bool

class MeetingTopicOut(BaseModel):
    id: int
    title: str
    timestamp: float
    class Config:
        from_attributes = True

class MeetingSummaryOut(BaseModel):
    id: int
    overview: str
    bullet_points: List[str]
    class Config:
        from_attributes = True

class MeetingListItem(BaseModel):
    id: int
    title: str
    created_at: datetime
    duration_seconds: int
    audio_url: Optional[str] = None
    participants: List[str]
    action_items_count: int
    class Config:
        from_attributes = True

class MeetingDetail(BaseModel):
    id: int
    title: str
    created_at: datetime
    duration_seconds: int
    audio_url: Optional[str] = None
    participants: List[str]
    segments: List[TranscriptSegmentOut]
    summary: Optional[MeetingSummaryOut] = None
    action_items: List[ActionItemOut] = []
    topics: List[MeetingTopicOut] = []
    action_items_count: Optional[int] = 0
    class Config:
        from_attributes = True

class MeetingCreate(BaseModel):
    title: str
    participants: List[str]
    transcript_text: str
    duration_seconds: Optional[int] = 180
    audio_url: Optional[str] = None

class AskAIRequest(BaseModel):
    question: str
# Alias for backwards compatibility
ActionItem = ActionItemOut