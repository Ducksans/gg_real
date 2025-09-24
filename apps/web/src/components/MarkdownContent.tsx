/**
 * file: apps/web/src/components/MarkdownContent.tsx
 * owner: duksan
 * created: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * updated: 2025-09-22 19:10 UTC / 2025-09-23 04:10 KST
 * purpose: Markdown 문자열을 기본 스타일과 함께 렌더링하는 컴포넌트
 * doc_refs: []
 */

import ReactMarkdown from 'react-markdown';

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
