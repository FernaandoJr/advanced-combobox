import { Fragment, type ReactNode } from "react";

/*
  Minimal TSX highlighter for the playground's generated code (no dependency).
  Token classes are colored via --syn-* vars in preview.css, theme-aware.
*/

const TOKEN_RE = new RegExp(
  [
    /("(?:[^"\\]|\\.)*")/.source, // 1 double-quoted string
    /('(?:[^'\\]|\\.)*')/.source, // 2 single-quoted string
    /(`(?:[^`\\]|\\.)*`)/.source, // 3 template string
    /(\b\d+(?:\.\d+)?\b)/.source, // 4 number
    /(\b(?:import|from|export|const|return|default|true|false|null|undefined)\b)/.source, // 5 keyword
    /(<\/?[A-Z][\w.]*|\/>)/.source, // 6 JSX tag open/close
    /([A-Za-z_$][\w$]*)(?=\s*=(?!==))/.source, // 7 prop / key (before '='),
    /(\{|\}|=>)/.source, // 8 braces / arrow
    /([=~()<>:,/]+)/.source, // 9 punctuation
  ].join("|"),
  "g",
);

const CLASS_BY_GROUP = [
  "syn-s",
  "syn-s",
  "syn-s",
  "syn-n",
  "syn-k",
  "syn-t",
  "syn-a",
  "syn-p",
  "syn-p",
];

export function CodeBlock({ code }: { code: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of code.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(code.slice(lastIndex, index));
    const groupIndex = match.slice(1).findIndex((group) => group !== undefined);
    nodes.push(
      <span key={key++} className={CLASS_BY_GROUP[groupIndex]}>
        {match[0]}
      </span>,
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));

  return <Fragment>{nodes}</Fragment>;
}

/* ===== JSON visualizer (preview state) ===== */

function JsonValue({ value }: { value: unknown }): ReactNode {
  if (value === null || typeof value === "boolean")
    return <span className='syn-k'>{String(value)}</span>;
  if (typeof value === "number") return <span className='syn-n'>{value}</span>;
  if (typeof value === "string") return <span className='syn-s'>{JSON.stringify(value)}</span>;
  if (Array.isArray(value)) {
    return (
      <>
        <span className='syn-p'>[</span>
        {value.map((entry, index) => (
          <Fragment key={index}>
            <JsonValue value={entry} />
            {index < value.length - 1 && <span className='syn-p'>, </span>}
          </Fragment>
        ))}
        <span className='syn-p'>]</span>
      </>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <>
        <span className='syn-p'>{"{"} </span>
        {entries.map(([entryKey, entryValue], index) => (
          <Fragment key={entryKey}>
            <span className='syn-a'>{JSON.stringify(entryKey)}</span>
            <span className='syn-p'>: </span>
            <JsonValue value={entryValue} />
            {index < entries.length - 1 && <span className='syn-p'>, </span>}
          </Fragment>
        ))}
        <span className='syn-p'>{" }"}</span>
      </>
    );
  }
  return <span className='syn-p'>{String(value)}</span>;
}

export function JsonBlock({
  data,
  className = "",
}: {
  data: Record<string, unknown>;
  className?: string;
}) {
  const entries = Object.entries(data);
  return (
    <pre
      className={`w-full select-text overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed ${className}`}
    >
      <span className='syn-p'>{"{"}</span>
      {"\n"}
      {entries.map(([entryKey, entryValue], index) => (
        <Fragment key={entryKey}>
          {"  "}
          <span className='syn-a'>{JSON.stringify(entryKey)}</span>
          <span className='syn-p'>: </span>
          <JsonValue value={entryValue} />
          {index < entries.length - 1 && <span className='syn-p'>,</span>}
          {"\n"}
        </Fragment>
      ))}
      <span className='syn-p'>{"}"}</span>
    </pre>
  );
}
