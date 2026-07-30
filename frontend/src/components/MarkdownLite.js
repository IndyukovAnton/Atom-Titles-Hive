import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment } from 'react';
const INLINE_RE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/g;
function renderInline(text) {
    const parts = text.split(INLINE_RE);
    return parts.map((part, i) => {
        if (!part)
            return null;
        if (part.startsWith('**') && part.endsWith('**')) {
            return _jsx("strong", { children: part.slice(2, -2) }, i);
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return _jsx("em", { children: part.slice(1, -1) }, i);
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return (_jsx("code", { className: "text-xs bg-muted px-1.5 py-0.5 rounded font-mono", children: part.slice(1, -1) }, i));
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            return (_jsx("a", { href: linkMatch[2], target: "_blank", rel: "noreferrer", className: "text-primary underline-offset-2 hover:underline", children: linkMatch[1] }, i));
        }
        return _jsx(Fragment, { children: part }, i);
    });
}
export function MarkdownLite({ source, className }) {
    const lines = source.split('\n');
    const blocks = [];
    let listBuffer = [];
    const flushList = () => {
        if (listBuffer.length === 0)
            return;
        blocks.push(_jsx("ul", { className: "list-disc list-outside pl-5 space-y-1 my-3 text-sm text-muted-foreground", children: listBuffer.map((item, i) => (_jsx("li", { children: renderInline(item) }, i))) }, `ul-${blocks.length}`));
        listBuffer = [];
    };
    for (const line of lines) {
        const trimmed = line.trimEnd();
        if (trimmed.startsWith('### ')) {
            flushList();
            blocks.push(_jsx("h4", { className: "text-sm font-semibold mt-4 mb-1", children: renderInline(trimmed.slice(4)) }, blocks.length));
        }
        else if (trimmed.startsWith('## ')) {
            flushList();
            blocks.push(_jsx("h3", { className: "text-base font-semibold mt-5 mb-2", children: renderInline(trimmed.slice(3)) }, blocks.length));
        }
        else if (trimmed.startsWith('# ')) {
            flushList();
            blocks.push(_jsx("h2", { className: "text-lg font-bold mt-6 mb-2 text-foreground", children: renderInline(trimmed.slice(2)) }, blocks.length));
        }
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            listBuffer.push(trimmed.slice(2));
        }
        else if (trimmed === '') {
            flushList();
        }
        else {
            flushList();
            blocks.push(_jsx("p", { className: "text-sm my-2 leading-relaxed", children: renderInline(trimmed) }, blocks.length));
        }
    }
    flushList();
    return _jsx("div", { className: className, children: blocks });
}
