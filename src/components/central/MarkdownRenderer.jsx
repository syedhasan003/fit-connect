/**
 * MarkdownRenderer
 * Parses the raw markdown that OpenAI returns and renders it as clean, styled JSX.
 * Handles: ### headers, **bold**, bullet lists (- and *), numbered lists, line breaks.
 */
export default function MarkdownRenderer({ text }) {
    if (!text) return null;
    const blocks = parseBlocks(text);
  
    return (
      <div style={{ lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
        {blocks.map((block, i) => {
          switch (block.type) {
            case "h3":
              return (
                <p key={i} style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  marginTop: i === 0 ? 0 : 18,
                  marginBottom: 6,
                  letterSpacing: 0.2,
                }}>
                  {block.text}
                </p>
              );
            case "bullet":
              return (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{
                    marginTop: 7,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(140,170,255,0.7)",
                    flexShrink: 0,
                  }} />
                  <span>{renderInline(block.text)}</span>
                </div>
              );
            case "numbered":
              return (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(140,170,255,0.8)",
                    minWidth: 20,
                    textAlign: "right",
                  }}>
                    {block.num}.
                  </span>
                  <span>{renderInline(block.text)}</span>
                </div>
              );
            case "divider":
              return (
                <div key={i} style={{
                  height: 1,
                  background: "rgba(255,255,255,0.08)",
                  margin: "14px 0",
                }} />
              );
            default: // paragraph
              return (
                <p key={i} style={{ marginBottom: 10 }}>
                  {renderInline(block.text)}
                </p>
              );
          }
        })}
      </div>
    );
  }
  
  // ─── INLINE: renders **bold** within a string ───
  function renderInline(text) {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={i} style={{ fontWeight: 600, color: "#fff" }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }
  
  // ─── BLOCK PARSER ───
  function parseBlocks(raw) {
    // Normalise: collapse \r\n, split on double newlines or single newlines
    const lines = raw
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  
    const blocks = [];
  
    lines.forEach((line) => {
      // --- divider (---, ---, ***)
      if (/^[-*]{3,}$/.test(line)) {
        blocks.push({ type: "divider" });
        return;
      }
  
      // --- h3 header (### Title or ## Title)
      const hMatch = line.match(/^#{2,3}\s+(.+)/);
      if (hMatch) {
        blocks.push({ type: "h3", text: hMatch[1].replace(/\*\*/g, "") });
        return;
      }
  
      // --- bullet (- text  or  * text  or  – text)
      const bMatch = line.match(/^[-*–]\s+(.+)/);
      if (bMatch) {
        blocks.push({ type: "bullet", text: bMatch[1] });
        return;
      }
  
      // --- numbered list (1. text)
      const nMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (nMatch) {
        blocks.push({ type: "numbered", num: nMatch[1], text: nMatch[2] });
        return;
      }
  
      // --- plain paragraph
      blocks.push({ type: "paragraph", text: line });
    });
  
    return blocks;
  }