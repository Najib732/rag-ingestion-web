"use client";

import ReactMarkdown from "react-markdown";

// Shows the AI answer as formatted text, and turns citations like [1] into
// small clickable badges that point at the matching source below the answer.
export function AnswerContent({
  content,
  sourceCount,
  onCite,
}: {
  content: string;
  sourceCount: number;
  onCite: (index: number) => void;
}) {
  // "[1]" → "[1](#cite-1)" so markdown renders it as a link we can style.
  // Only numbers that match a real source are converted.
  const withLinks = content.replace(/\[(\d+)\](?!\()/g, (match, n) => {
    const index = Number(n);
    if (index >= 1 && index <= sourceCount) return `[${n}](#cite-${n})`;
    return match;
  });

  return (
    <div className="answer text-[15px]">
      <ReactMarkdown
        components={{
          a({ href, children }) {
            if (href?.startsWith("#cite-")) {
              const index = Number(href.slice("#cite-".length));
              return (
                <button
                  type="button"
                  onClick={() => onCite(index)}
                  className="mx-0.5 inline-grid h-5 min-w-5 place-items-center rounded-md bg-brand-soft px-1 align-text-top text-[11px] font-semibold text-brand hover:bg-brand hover:text-white"
                  title={`Show source ${index}`}
                >
                  {children}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer" className="text-brand underline">
                {children}
              </a>
            );
          },
        }}
      >
        {withLinks}
      </ReactMarkdown>
    </div>
  );
}
