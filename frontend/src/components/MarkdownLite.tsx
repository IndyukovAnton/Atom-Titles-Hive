import { Fragment, type ReactNode } from 'react';

// Минимальный markdown-renderer для changelog без внешних зависимостей.
// Поддерживает: # / ## / ### заголовки, - списки, **bold**, *italic*, `code`,
// [text](url), пустые строки → разделение параграфов.
// Содержимое приходит из build-bundled MD-файлов (controlled), так что
// XSS-риска нет — но мы всё равно идём через React-узлы, не innerHTML.

interface MarkdownLiteProps {
  source: string;
  className?: string;
}

const INLINE_RE =
  /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/g;

function renderInline(text: string): ReactNode[] {
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function MarkdownLite({ source, className }: MarkdownLiteProps) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="list-disc list-outside pl-5 space-y-1 my-3 text-sm text-muted-foreground"
      >
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <h4 key={blocks.length} className="text-sm font-semibold mt-4 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h3 key={blocks.length} className="text-base font-semibold mt-5 mb-2">
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(
        <h2
          key={blocks.length}
          className="text-lg font-bold mt-6 mb-2 text-foreground"
        >
          {renderInline(trimmed.slice(2))}
        </h2>,
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={blocks.length} className="text-sm my-2 leading-relaxed">
          {renderInline(trimmed)}
        </p>,
      );
    }
  }
  flushList();

  return <div className={className}>{blocks}</div>;
}
