import { useState, useRef, useEffect } from "react";
import CitationList from "./CitationList";

interface Citation {
  index: number;
  content: string;
  preview: string;
  score: number | null;
  filename: string;
}

interface Message {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
  citations?: Citation[];
}

interface Props {
  suggestions: string[];
}

export default function ChatWindow({ suggestions }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Document loaded. Ask me anything about it." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question?: string) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);

    setMessages((m) => [...m, { role: "user", text: q }]);
    setMessages((m) => [
      ...m,
      { role: "ai", text: "", loading: true, citations: [] },
    ]);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      let citations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

          try {
            const parsed = JSON.parse(line.slice(6));

            if (parsed.type === "citations") {
              // Citations arrive first — store them immediately
              citations = parsed.citations;
              setMessages((m) => [
                ...m.slice(0, -1),
                { role: "ai", text: "", loading: true, citations },
              ]);
            } else if (parsed.type === "text") {
              // Stream the answer text
              aiText += parsed.text;
              setMessages((m) => [
                ...m.slice(0, -1),
                { role: "ai", text: aiText, loading: false, citations },
              ]);
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      }
    } catch {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "ai",
          text: "Something went wrong. Please try again.",
          loading: false,
          citations: [],
        },
      ]);
    }

    setLoading(false);
  };

  const showSuggestions = messages.length === 1 && suggestions.length > 0;

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.role === "ai" && <span className="ai-label">◈</span>}
            <div className="msg-content">
              <div className="bubble">
                {m.loading ? (
                  <span className="typing">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                )}
              </div>

              {/* Citations appear below the answer bubble */}
              {m.role === "ai" &&
                !m.loading &&
                m.citations &&
                m.citations.length > 0 && (
                  <CitationList citations={m.citations} />
                )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              className="suggestion"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                send(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask a question about your document..."
          disabled={loading}
          className="chat-input"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="send-btn"
        >
          {loading ? "..." : "↑"}
        </button>
      </div>
    </div>
  );
}
