"use client";

import { useCallback, useRef } from "react";

export interface Range2 {
  start: number;
  end: number;
}

function offsetIn(container: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n === node) return total + offset;
    total += n.textContent?.length ?? 0;
  }
  return total;
}

function merge(ranges: Range2[]): Range2[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: Range2[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out;
}

/**
 * Doan van cho phep boi vang bang chuot. Nhap vao vung da boi de xoa.
 * Luu duoi dang khoang ky tu nen khong bi vo khi React render lai.
 */
export function HighlightableText({
  text,
  ranges,
  onChange,
  enabled = true,
}: {
  text: string;
  ranges: Range2[];
  onChange: (next: Range2[]) => void;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseUp = useCallback(() => {
    if (!enabled || !ref.current) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const r = sel.getRangeAt(0);
    if (!ref.current.contains(r.commonAncestorContainer)) return;

    let start = offsetIn(ref.current, r.startContainer, r.startOffset);
    let end = offsetIn(ref.current, r.endContainer, r.endOffset);
    if (start > end) [start, end] = [end, start];
    // bo khoang trang thua o hai dau
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (end - start < 2) return;

    onChange(merge([...ranges, { start, end }]));
    sel.removeAllRanges();
  }, [enabled, onChange, ranges, text]);

  const removeAt = (pos: number) => {
    onChange(ranges.filter((r) => !(pos >= r.start && pos < r.end)));
  };

  const merged = merge(ranges);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach((r, i) => {
    if (r.start > cursor) parts.push(text.slice(cursor, r.start));
    parts.push(
      <mark
        key={i}
        onClick={() => removeAt(r.start)}
        title="Nhấp để bỏ bôi vàng"
        className="cursor-pointer rounded-sm bg-amber-400/30 px-0.5 text-amber-100 transition-colors hover:bg-amber-400/45"
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    cursor = r.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <span ref={ref} onMouseUp={handleMouseUp} className="select-text">
      {parts}
    </span>
  );
}
