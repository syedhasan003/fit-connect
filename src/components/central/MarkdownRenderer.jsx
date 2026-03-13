/**
 * MarkdownRenderer
 * Handles: h2, h3, bullet, numbered, divider, italic, table, paragraph
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
                  color: "#9CA3AF",
                  fontSize: 15,
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
                  color: "#9CA3AF",
                  fontSize: 15,
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
                borderLeft: "3px solid rgba(168,85,247,0.35)",
                color: "#6B7280",
                fontSize: 14.5,
                fontStyle: "italic",
                lineHeight: 1.7,
                letterSpacing: 0.3,
              }}>
                {renderInline(block.text)}
              </div>
            );
          case "table":
            return <MarkdownTable key={i} headers={block.headers} rows={block.rows} />;
          default: // paragraph
            return (
              <p key={i} style={{
                marginBottom: 16,
                color: "#9CA3AF",
                fontSize: 15,
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

// ─── TABLE COMPONENT ──────────────────────────────────────────────────────────
function MarkdownTable({ headers, rows }) {
  return (
    <div style={{
      overflowX: "auto",
      margin: "20px 0",
      borderRadius: 14,
      border: "1px solid #1E1E1E",
      WebkitOverflowScrolling: "touch",
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13.5,
        minWidth: 340,
      }}>
        <thead>
          <tr style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))",
          }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "11px 14px",
                textAlign: "left",
                fontWeight: 700,
                color: "#c4b5fd",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                borderBottom: "1px solid rgba(139,92,246,0.25)",
                whiteSpace: "nowrap",
              }}>
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0
                ? "#111111"
                : "transparent",
              transition: "background 0.15s",
            }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "10px 14px",
                  color: ci === 0 ? "#FFFFFF" : "#9CA3AF",
                  fontSize: ci === 0 ? 14 : 13,
                  fontWeight: ci === 0 ? 500 : 400,
                  borderBottom: "1px solid #1E1E1E",
                  verticalAlign: "top",
                  lineHeight: 1.5,
                }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── INLINE: renders **bold** within a string ─────────────────────────────────
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

// ─── BLOCK PARSER ─────────────────────────────────────────────────────────────
function parseBlocks(raw) {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim());
  // Don't filter empty lines yet — needed for table boundary detection

  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines
    if (!line) { i++; continue; }

    // --- divider (---, ___, ***)
    if (/^[-_*]{3,}$/.test(line)) {
      blocks.push({ type: "divider" });
      i++; continue;
    }

    // --- headers (### or ##)
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      blocks.push({ type: "h3", text: h3Match[1].replace(/\*\*/g, "") });
      i++; continue;
    }
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      blocks.push({ type: "h2", text: h2Match[1].replace(/\*\*/g, "") });
      i++; continue;
    }

    // --- markdown table detection: line starts and ends with |
    if (line.startsWith("|") && line.endsWith("|")) {
      // Collect all consecutive table lines
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith("|") && lines[j].endsWith("|")) {
        tableLines.push(lines[j]);
        j++;
      }

      if (tableLines.length >= 2) {
        // Parse header row
        const headers = splitTableRow(tableLines[0]);
        // Row 1 is separator (|---|---|), skip it. Rows 2+ are data.
        const rows = [];
        for (let k = 2; k < tableLines.length; k++) {
          const cells = splitTableRow(tableLines[k]);
          // Skip separator-like rows or entirely empty rows
          if (cells.every(c => /^[-: ]+$/.test(c))) continue;
          rows.push(cells);
        }
        if (headers.length > 0) {
          blocks.push({ type: "table", headers, rows });
          i = j;
          continue;
        }
      }
    }

    // --- bullet (-, *, •, –)
    const bMatch = line.match(/^[-*•–]\s+(.+)/);
    if (bMatch) {
      blocks.push({ type: "bullet", text: bMatch[1] });
      i++; continue;
    }

    // --- numbered list (1., 2., etc.)
    const nMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (nMatch) {
      blocks.push({ type: "numbered", num: nMatch[1], text: nMatch[2] });
      i++; continue;
    }

    // --- italic quote (starts and ends with *)
    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      blocks.push({ type: "italic", text: line.slice(1, -1) });
      i++; continue;
    }

    // --- plain paragraph
    blocks.push({ type: "paragraph", text: line });
    i++;
  }

  return blocks;
}

// Split a markdown table row "| a | b | c |" → ["a", "b", "c"]
function splitTableRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim())
    .filter((c) => c.length > 0 || true); // keep empty cells too
}
