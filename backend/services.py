import re
import json

SPEAKER_PALETTE = ["#4F46E5", "#059669", "#D97706", "#DC2626", "#7C3AED", "#2563EB"]

def parse_transcript_text(raw_text: str):
    lines = raw_text.strip().split("\n")
    segments = []
    speakers_map = {}
    current_time = 0.0

    timestamp_regex = re.compile(r"\[?(\d{1,2}):(\d{2})\]?")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        time_match = timestamp_regex.search(line)
        if time_match:
            mins, secs = int(time_match.group(1)), int(time_match.group(2))
            current_time = float(mins * 60 + secs)
            cleaned_line = timestamp_regex.sub("", line).strip()
        else:
            cleaned_line = line
            current_time += 4.0

        if ":" in cleaned_line:
            speaker_part, text_part = cleaned_line.split(":", 1)
            speaker = speaker_part.strip()
            text = text_part.strip()
        else:
            speaker = "Participant"
            text = cleaned_line.strip()

        if speaker not in speakers_map:
            color_index = len(speakers_map) % len(SPEAKER_PALETTE)
            speakers_map[speaker] = SPEAKER_PALETTE[color_index]

        segments.append({
            "speaker_name": speaker,
            "speaker_color": speakers_map[speaker],
            "start_time": current_time,
            "end_time": current_time + 4.5,
            "text": text
        })

    return segments, list(speakers_map.keys())

def generate_mock_ai_insights(title: str, segments: list):
    overview = (
        f"During the '{title}' sync, the team reviewed current progress, identified key operational bottlenecks, "
        "and established definitive execution targets for the upcoming cycle. The team reached consensus on prioritization "
        "and cross-functional handoffs."
    )
    
    bullets = [
        "Reviewed sprint burn-down charts and reconciled pending technical debt items.",
        "Addressed API latency bottlenecks and aligned on server response optimizations.",
        "Confirmed resource allocation and deployment schedule for staging testing."
    ]

    action_items = [
        {"assignee": segments[0]["speaker_name"] if segments else "Lead", "text": "Draft and circulate system design revisions by Thursday"},
        {"assignee": segments[1]["speaker_name"] if len(segments) > 1 else "Dev", "text": "Finalize integration tests and update CI/CD runner pipelines"},
        {"assignee": "Team", "text": "Review architecture memo ahead of Monday standup"}
    ]

    topics = [
        {"title": "1. Opening & Status Check", "timestamp": 0.0},
        {"title": "2. Architecture Decisions & Challenges", "timestamp": min(45.0, segments[-1]["start_time"] if segments else 10.0)},
        {"title": "3. Action Items & Timeline Alignment", "timestamp": min(95.0, segments[-1]["start_time"] if segments else 20.0)}
    ]

    return overview, bullets, action_items, topics