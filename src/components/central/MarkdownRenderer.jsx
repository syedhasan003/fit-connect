/**
 * ULTRA PREMIUM MarkdownRenderer
 * Perfect typography, emoji spacing, gradient effects
 */
export default function MarkdownRenderer({ text }) {
  if (!text) return null;
  const blocks = parseBlocks(text);

  return (
    <div style={{ lineHeight: 1.8 }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h3":
            return (
              <h3 key={i} style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginTop: i === 0 ? 0 : 28,
                marginBottom: 14,
                letterSpacing: 0.4,
                display: "flex",
                alignItems: "center",
                gap: 12,
                lineHeight: 1.4,
              }}>
                {block.text}
              </h3>
            );
          case "h2":
            return (
              <h2 key={i} style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                marginTop: i === 0 ? 0 : 30,
                marginBottom: 16,
                letterSpacing: 0.5,
                lineHeight: 1.3,
              }}>
                {block.text}
              </h2>
            );
          case "bullet":
            return (
              <div key={i} style={{ 
                display: "flex", 
                gap: 16, 
                marginBottom: 12, 
                alignItems: "flex-start",
                paddingLeft: 6,
              }}>
                <span style={{
                  marginTop: 10,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  flexShrink: 0,
                  boxShadow: "0 0 10px rgba(139, 92, 246, 0.5), 0 0 3px rgba(99, 102, 241, 0.3)",
                }} />
                <span style={{
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 15.5,
                  lineHeight: 1.75,
                  letterSpacing: 0.2,
                }}>
                  {renderInline(block.text)}
                </span>
              </div>
            );
          case "numbered":
            return (
              <div key={i} style={{ 
                display: "flex", 
                gap: 16, 
                marginBottom: 12, 
                alignItems: "flex-start",
                paddingLeft: 6,
              }}>
                <span style={{
                  flexShrink: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  minWidth: 28,
                  textAlign: "right",
                }}>
                  {block.num}.
                </span>
                <span style={{
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 15.5,
                  lineHeight: 1.75,
                  letterSpacing: 0.2,
                }}>
                  {renderInline(block.text)}
                </span>
              </div>
            );
          case "divider":
            return (
              <div key={i} style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4), transparent)",
                margin: "24px 0",
              }} />
            );
          case "italic":
            return (
              <div key={i} style={{ 
                marginTop: 18,
                marginBottom: 18,
                paddingLeft: 18,
                borderLeft: "3px solid rgba(139, 92, 246, 0.35)",
                color: "rgba(255,255,255,0.72)",
                fontSize: 14.5,
                fontStyle: "italic",
                lineHeight: 1.7,
                letterSpacing: 0.3,
              }}>
                {renderInline(block.text)}
              </div>
            );
          default: // paragraph
            return (
              <p key={i} style={{ 
                marginBottom: 16,
                color: "rgba(255,255,255,0.88)",
                fontSize: 15.5,
                lineHeight: 1.75,
                letterSpacing: 0.2,
              }}>
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
        <strong key={i} style={{ 
          fontWeight: 700, 
          background: "linear-gradient(135deg, #a78bfa, #818cf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: 0.3,
        }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── BLOCK PARSER ───
function parseBlocks(raw) {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks = [];

  lines.forEach((line) => {
    // --- divider (---, ___, ***)
    if (/^[-_*]{3,}$/.test(line)) {
      blocks.push({ type: "divider" });
      return;
    }

    // --- headers (### or ##)
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      blocks.push({ type: "h3", text: h3Match[1].replace(/\*\*/g, "") });
      return;
    }

    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      blocks.push({ type: "h2", text: h2Match[1].replace(/\*\*/g, "") });
      return;
    }

    // --- bullet (-, *, •, –)
    const bMatch = line.match(/^[-*•–]\s+(.+)/);
    if (bMatch) {
      blocks.push({ type: "bullet", text: bMatch[1] });
      return;
    }

    // --- numbered list (1., 2., etc.)
    const nMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (nMatch) {
      blocks.push({ type: "numbered", num: nMatch[1], text: nMatch[2] });
      return;
    }

    // --- italic quote (starts and ends with *)
    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      blocks.push({ type: "italic", text: line.slice(1, -1) });
      return;
    }

    // --- plain paragraph
    blocks.push({ type: "paragraph", text: line });
  });

  return blocks;
}