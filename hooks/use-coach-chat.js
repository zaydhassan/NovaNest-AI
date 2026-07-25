"use client";

import { useCallback, useState } from "react";
import { parseCitations } from "@/lib/career/ui/citations";

const decodeMeta = (b64) => {
  try {
    return JSON.parse(atob(b64 || ""));
  } catch {
    return { agentIds: [], followUps: [], memoryBlocks: [], intent: "general" };
  }
};

/**
 * useCoachChat — the shared streaming chat hook for the /coach surface (M5)
 * and the global CoachDrawer. Posts to /api/chat, streams the assistant reply
 * token-by-token into state, parses metadata from response headers, and
 * finalizes the assistant message with parsed citations when the stream ends.
 *
 * @param {{ initialMessages?: any[], initialSessionId?: string|null, onSessionCreated?: (id:string)=>void }} opts
 */
export function useCoachChat({ initialMessages = [], initialSessionId = null, onSessionCreated } = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);

  const send = useCallback(
    async (text) => {
      if (!text.trim() || streaming) return;
      const userMsg = { id: `u_${Date.now()}`, role: "user", content: text, data: {} };
      const assistantId = `a_${Date.now()}`;
      const assistantMsg = { id: assistantId, role: "assistant", content: "", data: {} };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sessionId }),
        });
        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || "The coach couldn't reply right now.");
        }

        const newSessionId = res.headers.get("X-Session-Id") || sessionId;
        const meta = decodeMeta(res.headers.get("X-Career-OS-Meta"));
        if (newSessionId && newSessionId !== sessionId) {
          setSessionId(newSessionId);
          onSessionCreated?.(newSessionId);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m))
          );
        }
        acc += decoder.decode();

        const citations = parseCitations(acc, meta.memoryBlocks || []);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: acc || " ", data: { ...meta, citations } }
              : m
          )
        );
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: e?.message || "Something went wrong. Please try again." }
              : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [sessionId, streaming, onSessionCreated]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return { messages, setMessages, streaming, sessionId, send, reset };
}