import { useCallback, useRef, useState } from "react";

/**
 * Pointer handling shared by the scrubber controls.
 */

// How far a touch must travel before we decide what it meant.
const INTENT_THRESHOLD_PX = 6;

export default function useScrubGesture({
  trackRef,
  computeValue,
  onChange,
  isDisabled,
}: {
  trackRef: React.RefObject<HTMLDivElement | null>;
  computeValue: (clientX: number) => number;
  onChange: (value: number) => void;
  isDisabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  // Mirrors isDragging so a move landing in the same tick as the state update isn't dropped.
  const draggingRef = useRef(false);
  // A touch we've seen but not yet claimed.
  const pendingRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const begin = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      setIsDragging(true);
      trackRef.current?.setPointerCapture(e.pointerId);
      onChange?.(computeValue(e.clientX));
    },
    [trackRef, computeValue, onChange],
  );

  const end = useCallback(() => {
    draggingRef.current = false;
    pendingRef.current = null;
    setIsDragging(false);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isDisabled) return;
      if (e.pointerType === "touch") {
        pendingRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        return;
      }
      e.preventDefault();
      begin(e);
    },
    [isDisabled, begin],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pending = pendingRef.current;
      if (pending) {
        if (e.pointerId !== pending.id) return;
        const dx = e.clientX - pending.x;
        const dy = e.clientY - pending.y;
        if (Math.abs(dx) < INTENT_THRESHOLD_PX && Math.abs(dy) < INTENT_THRESHOLD_PX) return;
        pendingRef.current = null;
        // Vertical intent belongs to the page, and we never claimed the pointer, so the
        // browser is already free to scroll with it.
        if (Math.abs(dy) >= Math.abs(dx)) return;
        begin(e);
        return;
      }
      if (!draggingRef.current) return;
      onChange?.(computeValue(e.clientX));
    },
    [begin, computeValue, onChange],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      // A touch that lifted before showing any intent is a tap, which sets the value just
      // like the press-to-jump a mouse gets.
      if (pendingRef.current?.id === e.pointerId) onChange?.(computeValue(e.clientX));
      end();
    },
    [computeValue, onChange, end],
  );

  // Fired when the browser takes the gesture over to scroll the page.
  const onPointerCancel = useCallback(() => end(), [end]);

  return { isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
