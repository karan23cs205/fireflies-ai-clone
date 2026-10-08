const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchMeetings(search?: string, participant?: string, sort?: string) {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (participant) params.append("participant", participant);
    if (sort) params.append("sort", sort);

    const res = await fetch(`${BASE_URL}/api/meetings?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("Backend returned non-200 for meetings list:", res.status);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Could not connect to FastAPI backend at", BASE_URL, error);
    return [];
  }
}

export async function fetchMeetingDetail(id: number) {
  try {
    const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Meeting ${id} not found:`, res.status);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching meeting detail:", error);
    return null;
  }
}

export async function createMeetingPasted(data: {
  title: string;
  participants: string[];
  transcript_text: string;
  audio_url?: string;
  duration_seconds?: number;
}) {
  const res = await fetch(`${BASE_URL}/api/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create meeting");
  return await res.json();
}

export async function deleteMeeting(id: number) {
  const res = await fetch(`${BASE_URL}/api/meetings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete meeting");
  return await res.json();
}

export async function toggleActionItem(id: number, is_completed: boolean) {
  const res = await fetch(`${BASE_URL}/api/action-items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_completed }),
  });
  if (!res.ok) throw new Error("Failed to update action item");
  return await res.json();
}

export async function createActionItem(
  meetingId: number,
  data: { text: string; assignee?: string }
) {
  const res = await fetch(`${BASE_URL}/api/action-items/${meetingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create action item");
  return await res.json();
}

export const addActionItem = createActionItem;

export async function askMeetingAI(meetingId: number, question: string) {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/ask-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to query AI assistant");
  return await res.json();
}

export async function regenerateSummary(meetingId: number) {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/regenerate-summary`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to regenerate summary");
  return await res.json();
}

export async function dispatchMeetingWebhook(meetingId: number, channel: "slack" | "jira" | "notion") {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/dispatch-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  });
  if (!res.ok) throw new Error("Webhook dispatch failed");
  return await res.json();
}