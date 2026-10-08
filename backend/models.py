from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    duration_seconds = Column(Integer, default=0)
    audio_url = Column(String(500), nullable=True)
    participants = Column(Text, nullable=False, default="[]")  # Stored as JSON string

    segments = relationship("TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegment.start_time")
    summary = relationship("MeetingSummary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    topics = relationship("MeetingTopic", back_populates="meeting", cascade="all, delete-orphan")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_name = Column(String(100), nullable=False)
    speaker_color = Column(String(20), default="#6366F1")
    start_time = Column(Float, nullable=False, index=True)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    meeting = relationship("Meeting", back_populates="segments")

class MeetingSummary(Base):
    __tablename__ = "meeting_summaries"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False)
    overview = Column(Text, nullable=False)
    bullet_points = Column(Text, nullable=False)  # Stored as JSON string array

    meeting = relationship("Meeting", back_populates="summary")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    assignee = Column(String(100), nullable=True)
    text = Column(String(500), nullable=False)
    is_completed = Column(Boolean, default=False)

    meeting = relationship("Meeting", back_populates="action_items")

class MeetingTopic(Base):
    __tablename__ = "meeting_topics"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    timestamp = Column(Float, nullable=False)

    meeting = relationship("Meeting", back_populates="topics")