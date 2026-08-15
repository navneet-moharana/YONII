import React from "react";

// Renders a subset of markdown-ish AI output:
//   # / ## / ### / #### headings
//   **bold** inline & full-line bold as heading
//   paragraphs & bullet lists ("- ", "• ", "* ")
function inlineBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

const HEADING_CLASSES = {
  h1: "font-display text-2xl font-semibold text-[var(--yonii-primary)] mt-5 mb-2",
  h2: "font-display text-xl font-semibold text-[var(--yonii-primary)] mt-5 mb-2",
  h3: "font-display text-lg font-semibold text-[var(--yonii-primary)] mt-4 mb-1.5",
  h4: "font-display text-base font-semibold text-[var(--yonii-primary)] mt-4 mb-1",
};

function renderHeading(level, text, key) {
  const Tag = `h${level}`;
  return (
    <Tag key={key} className={HEADING_CLASSES[Tag] || HEADING_CLASSES.h4}>
      {inlineBold(text)}
    </Tag>
  );
}

export default function AIMessage({ text }) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let list = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {list.map((l, i) => <li key={i}>{inlineBold(l)}</li>)}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { flushList(); return; }

    // Horizontal rule → skip
    if (/^---+$/.test(line)) { flushList(); return; }

    // ATX heading: #, ##, ###, ####
    const atx = line.match(/^(#{1,4})\s+(.*)$/);
    if (atx) {
      flushList();
      blocks.push(renderHeading(atx[1].length, atx[2].replace(/[:：]\s*$/, ""), `h-${idx}`));
      return;
    }

    // Whole line wrapped in ** = heading
    if (/^\*\*[^*]+\*\*[:：]?\s*$/.test(line)) {
      flushList();
      const inner = line.replace(/^\*\*|\*\*$/g, "").replace(/[:：]\s*$/, "");
      blocks.push(renderHeading(4, inner, `hh-${idx}`));
      return;
    }

    // Line starts with a **bold prefix** followed by more text — split into heading + para
    const boldPrefix = line.match(/^\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/);
    if (boldPrefix) {
      flushList();
      blocks.push(renderHeading(4, boldPrefix[1], `hp-${idx}`));
      blocks.push(<p key={`pp-${idx}`}>{inlineBold(boldPrefix[2])}</p>);
      return;
    }

    if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
      list.push(line.slice(2));
      return;
    }

    flushList();
    blocks.push(<p key={`p-${idx}`}>{inlineBold(line)}</p>);
  });
  flushList();

  return <div className="prose-yonii text-[var(--yonii-text)]">{blocks}</div>;
}
