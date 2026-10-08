import json
import models
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

meetings_to_add = [
    {
        "title": "Customer Discovery: Enterprise Security & SSO",
        "duration_seconds": 210,
        "audio_url": "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3",
        "participants": ["Elena Rostova", "Marcus Brody"],
        "overview": "Customer interview regarding enterprise security requirements, Okta SAML SSO integrations, and SOC2 compliance audit readiness.",
        "bullet_points": [
            "Customer requires SAML 2.0 and Okta integration before enterprise pilot.",
            "Role-based access control (RBAC) needs granular permission tiers.",
            "Audit logging must retain compliance events for at least 90 days."
        ],
        "action_items": [
            {"text": "Send SAML 2.0 configuration guide to Marcus", "assignee": "Elena Rostova", "is_completed": False},
            {"text": "Draft SOC2 audit readiness checklist", "assignee": "Elena Rostova", "is_completed": True}
        ],
        "transcripts": [
            {"speaker_name": "Elena Rostova", "speaker_color": "#6366F1", "start_time": 0, "end_time": 18, "text": "Marcus, thanks for joining. Let's walk through your team's compliance requirements."},
            {"speaker_name": "Marcus Brody", "speaker_color": "#06B6D4", "start_time": 19, "end_time": 42, "text": "Our primary blocker for enterprise rollout is Okta SAML SSO support with automated SCIM user provisioning."},
            {"speaker_name": "Elena Rostova", "speaker_color": "#6366F1", "start_time": 43, "end_time": 68, "text": "Understood. We are finalizing our identity provider layer this sprint, and I can share early staging access next week."}
        ]
    },
    {
        "title": "Q4 Engineering Roadmap & Latency Optimization",
        "duration_seconds": 320,
        "audio_url": "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3",
        "participants": ["Alex Chen", "Sarah Jenkins", "Devin Vance"],
        "overview": "Technical review of database bottlenecks, API response latency, and planned Redis caching layer deployment.",
        "bullet_points": [
            "Search endpoint P99 latency currently spikes above 850ms under peak load.",
            "Identified missing composite indexes on meetings and transcript tables.",
            "Redis cluster will cache serialized summary cards to cut database load by 60%."
        ],
        "action_items": [
            {"text": "Add composite database index on meeting queries", "assignee": "Devin Vance", "is_completed": False},
            {"text": "Benchmark Redis cache hit ratios on staging", "assignee": "Sarah Jenkins", "is_completed": False},
            {"text": "Conduct load testing with 500 concurrent connections", "assignee": "Alex Chen", "is_completed": True}
        ],
        "transcripts": [
            {"speaker_name": "Alex Chen", "speaker_color": "#10B981", "start_time": 0, "end_time": 25, "text": "Team, our P99 latency on the search endpoint is hovering near 850ms, which is unacceptable for production."},
            {"speaker_name": "Devin Vance", "speaker_color": "#F59E0B", "start_time": 26, "end_time": 54, "text": "The query logs indicate full table scans during participant filtering. Adding composite indexes should solve most of it."},
            {"speaker_name": "Sarah Jenkins", "speaker_color": "#EC4899", "start_time": 55, "end_time": 85, "text": "I'll back Devin up with a Redis layer for the precomputed summaries. We will test the changes on staging by Thursday."}
        ]
    },
    {
        "title": "Sprint Retrospective & Velocity Metrics",
        "duration_seconds": 240,
        "audio_url": "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3",
        "participants": ["Karan", "Sarah Jenkins", "Devin Vance"],
        "overview": "Weekly retro celebrating sprint completion goals and discussing asynchronous team communication improvements.",
        "bullet_points": [
            "Team closed 24 story points, hitting 95% planned sprint commitment.",
            "Live audio transcription proof-of-concept received positive internal feedback.",
            "Action item tracking should notify Slack channels automatically."
        ],
        "action_items": [
            {"text": "Publish meeting summary webhooks documentation", "assignee": "Karan", "is_completed": False},
            {"text": "Prepare sprint demo recording for stakeholders", "assignee": "Sarah Jenkins", "is_completed": False}
        ],
        "transcripts": [
            {"speaker_name": "Karan", "speaker_color": "#4F46E5", "start_time": 0, "end_time": 22, "text": "Great job everyone this sprint. Our completion rate hit 95% and the real-time dictation features are running smoothly."},
            {"speaker_name": "Sarah Jenkins", "speaker_color": "#EC4899", "start_time": 23, "end_time": 45, "text": "Agreed. Next up, we should ensure the action items auto-sync into our Slack engineering channel."},
            {"speaker_name": "Devin Vance", "speaker_color": "#F59E0B", "start_time": 46, "end_time": 70, "text": "I will handle the webhook payload formatting so the notifications look clean."}
        ]
    }
]

for data in meetings_to_add:
    existing = db.query(models.Meeting).filter(models.Meeting.title == data["title"]).first()
    if not existing:
        meeting = models.Meeting(
            title=data["title"],
            duration_seconds=data["duration_seconds"],
            audio_url=data["audio_url"],
            participants=json.dumps(data["participants"])
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        db.add(models.MeetingSummary(
            meeting_id=meeting.id,
            overview=data["overview"],
            bullet_points=json.dumps(data["bullet_points"])
        ))

        for ai in data["action_items"]:
            db.add(models.ActionItem(
                meeting_id=meeting.id,
                text=ai["text"],
                assignee=ai["assignee"],
                is_completed=ai["is_completed"]
            ))

        for seg in data["transcripts"]:
            db.add(models.TranscriptSegment(
                meeting_id=meeting.id,
                speaker_name=seg["speaker_name"],
                speaker_color=seg["speaker_color"],
                start_time=seg["start_time"],
                end_time=seg["end_time"],
                text=seg["text"]
            ))

        db.commit()
        print(f"Created meeting: {data['title']} (ID: {meeting.id})")
    else:
        print(f"Meeting already exists: {data['title']} (ID: {existing.id})")

db.close()
print("Seeding complete!")