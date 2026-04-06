import { useState } from "react";

interface Citation {
  index: number;
  content: string;
  preview: string;
  score: number | null;
  filename: string;
}

interface Props {
  citations: Citation[];
}

export default function CitationList({ citations }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="citations">
      <div className="cite-header">
        <span className="cite-icon">📄</span>
        <span>
          {citations.length} source{citations.length > 1 ? "s" : ""} from your
          document
        </span>
      </div>

      {citations.map((c) => (
        <div
          key={c.index}
          className={`cite-card ${expanded === c.index ? "cite-expanded" : ""}`}
          onClick={() => setExpanded(expanded === c.index ? null : c.index)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            setExpanded(expanded === c.index ? null : c.index)
          }
        >
          <div className="cite-top">
            <span className="cite-num">[{c.index}]</span>
            <span className="cite-preview">
              {expanded === c.index ? c.content : c.preview}
            </span>
            <div className="cite-right">
              {c.score !== null && (
                <span className="cite-score">{c.score}%</span>
              )}
              <span className="cite-toggle">
                {expanded === c.index ? "▲" : "▼"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
