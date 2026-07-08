const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatResponse {
  answer: string;
  confidence: "confirmed" | "estimated" | "verify_needed" | "cannot_answer";
  sources: { name: string; url: string; updated: string }[];
  suggested_questions: string[];
}

export async function sendChat(query: string, language = "en"): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, language }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function sendFeedback(query: string, helpful: boolean, comment?: string) {
  await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, helpful, comment }),
  });
}
