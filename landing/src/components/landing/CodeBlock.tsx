import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  filename?: string;
  code: string; // raw code for copy
  children: ReactNode; // tokenized JSX for display
}

const CodeBlock = ({ language, filename, code, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="code-surface rounded-lg overflow-hidden">
      <div className="flex items-center justify-between border-b border-[hsl(var(--code-border))] px-4 py-2">
        <div className="flex items-center gap-3 text-xs font-mono text-[hsl(var(--code-muted))]">
          <span className="uppercase tracking-wide">{language}</span>
          {filename && (
            <>
              <span className="text-[hsl(var(--code-border))]">/</span>
              <span>{filename}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[hsl(var(--code-muted))] hover:text-[hsl(var(--code-fg))] transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6 font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;