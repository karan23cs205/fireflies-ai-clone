export interface TranscriptSegment {
  id?: number;
  speaker_name: string;
  speaker_color?: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface ActionItem {
  id: number;
  text: string;
  assignee: string;
  is_completed: boolean;
}

export interface MeetingTopic {
  id?: number;
  title: string;
  timestamp: string;
}

export interface MeetingSummary {
  overview: string;
  bullet_points: string[];
}

export interface MeetingListItem {
  id: number;
  title: string;
  created_at: string;
  duration_seconds: number;
  audio_url?: string;
  participants: string[];
  action_items_count: number;
}

export interface MeetingDetail {
  id: number;
  title: string;
  created_at: string;
  duration_seconds: number;
  audio_url?: string;
  participants: string[];
  action_items_count?: number;
  transcript_segments: TranscriptSegment[];
  summary?: MeetingSummary;
  action_items: ActionItem[];
  topics?: MeetingTopic[];
}