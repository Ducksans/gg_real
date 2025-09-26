'use client';

import { useEffect, useRef } from 'react';
import type { Annotation } from '@/hooks/useAnnotations';

export type AnnotationLayerProps = {
  annotations: Annotation[];
  children: React.ReactNode;
};

const COLOR_MAP: Record<string, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  blue: '#bfdbfe',
};

export function AnnotationLayer({ annotations, children }: AnnotationLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const marks = root.querySelectorAll('[data-annotation-id]');
    marks.forEach((mark) => {
      const element = mark as HTMLElement;
      const parent = element.parentNode;
      if (!parent) return;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    });

    const sorted = [...annotations].sort((a, b) => a.position.start - b.position.start);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: { node: Text; start: number; end: number }[] = [];
    let offset = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const length = node.textContent?.length ?? 0;
      textNodes.push({ node, start: offset, end: offset + length });
      offset += length;
    }

    const locate = (pos: number) => {
      return textNodes.find((entry) => pos >= entry.start && pos <= entry.end);
    };

    sorted.forEach((annotation) => {
      const startEntry = locate(annotation.position.start);
      const endEntry = locate(annotation.position.end);
      if (!startEntry || !endEntry) {
        return;
      }
      const range = document.createRange();
      range.setStart(startEntry.node, annotation.position.start - startEntry.start);
      range.setEnd(endEntry.node, annotation.position.end - endEntry.start);
      const mark = document.createElement('mark');
      mark.dataset.annotationId = annotation.id;
      mark.className = 'rounded px-0.5 py-[1px]';
      mark.style.backgroundColor = COLOR_MAP[annotation.color] ?? COLOR_MAP.yellow;
      mark.style.boxShadow = `0 0 0 1px rgba(15, 23, 42, 0.05)`;
      mark.title = annotation.note ?? annotation.quote;
      try {
        range.surroundContents(mark);
      } catch (error) {
        console.warn('AnnotationLayer: surroundContents failed', error);
      }
    });
  }, [annotations]);

  return <div ref={rootRef}>{children}</div>;
}
