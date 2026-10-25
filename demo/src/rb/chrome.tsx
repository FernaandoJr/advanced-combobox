import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Eye, SquareCode, Monitor, Tablet, Smartphone, Maximize } from "lucide-react";

import useScrubGesture from "./useScrubGesture";

/* React Bits preview controls, copied literally (MIT):
   src/components/common/Preview/{PreviewSlider,PreviewSwitch,PreviewSelect,PreviewInput}.jsx
   Types are the only addition. */

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
const stepDecimals = (step: number) => {
  const s = step.toString();
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
};
const roundToStep = (val: number, step: number, min: number) => {
  const raw = Math.round((val - min) / step) * step + min;
  const decimals = Math.max(stepDecimals(step), stepDecimals(min));
  return Number(raw.toFixed(decimals));
};

export function PreviewSlider({
  title = "",
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  valueUnit = "",
  isDisabled = false,
  displayValue,
  onChange,
}: {
  title?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  valueUnit?: string;
  isDisabled?: boolean;
  displayValue?: (value: number) => string;
  onChange?: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isHoverDevice, setIsHoverDevice] = useState(false);

  const range = max - min;
  const percentage = range > 0 ? ((value - min) / range) * 100 : 0;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsHoverDevice(mq.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const computeValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + ratio * range;
      return clamp(roundToStep(raw, step, min), min, max);
    },
    [min, max, step, range, value],
  );

  const { isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useScrubGesture({
      trackRef,
      computeValue,
      isDisabled,
      onChange: onChange ?? (() => {}),
    });

  const isActive = isDragging || (isHoverDevice && isHovering);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isDisabled) return;
      let next;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = value + step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = value - step;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      e.preventDefault();
      onChange?.(clamp(roundToStep(next, step, min), min, max));
    },
    [value, step, min, max, onChange, isDisabled],
  );

  const ticks = 9;
  const decimals = stepDecimals(step);
  const formattedValue = displayValue
    ? displayValue(value)
    : `${Number(value.toFixed(decimals))}${valueUnit}`;

  return (
    <div className='scrubber'>
      <div
        className='scrubber-track'
        ref={trackRef}
        role='slider'
        aria-label={title}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        data-dragging={isDragging}
        data-disabled={isDisabled}
        data-active={isActive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onKeyDown={handleKeyDown}
      >
        <div className='scrubber-fill' style={{ width: `${percentage}%` }} />

        <div className='scrubber-ticks'>
          {Array.from({ length: ticks }, (_, i) => {
            const pos = ((i + 1) / (ticks + 1)) * 100;
            return <div className='scrubber-tick' key={i} style={{ left: `${pos}%` }} />;
          })}
        </div>

        <div className='scrubber-thumb-wrapper' style={{ left: `${percentage}%` }}>
          <div className='scrubber-thumb' />
        </div>

        <div className='scrubber-label'>{title}</div>
        <div className='scrubber-value'>{formattedValue}</div>
      </div>
    </div>
  );
}

export function PreviewSwitch({
  title = "",
  isChecked = false,
  onChange,
  isDisabled = false,
}: {
  title?: string;
  isChecked?: boolean;
  onChange?: (checked: boolean) => void;
  isDisabled?: boolean;
}) {
  const handleChange = () => {
    if (!isDisabled) onChange?.(!isChecked);
  };

  return (
    <div className='scrubber'>
      <button
        type='button'
        className='scrubber-track scrubber-track--switch'
        role='switch'
        aria-checked={isChecked}
        aria-label={title}
        aria-disabled={isDisabled}
        data-disabled={isDisabled}
        data-checked={isChecked}
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleChange}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleChange();
          }
        }}
      >
        <span className='scrubber-label'>{title}</span>
        <span className='scrubber-switch-toggle'>
          <span className='scrubber-switch-knob' />
        </span>
      </button>
    </div>
  );
}

const formatOptionLabel = (str: string) =>
  str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function PreviewSelect({
  title = "",
  options = [],
  value = "",
  isDisabled = false,
  onChange,
}: {
  title?: string;
  options?: { value: string; label: string }[];
  value?: string;
  isDisabled?: boolean;
  onChange?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formattedOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "string"
          ? { value: opt, label: formatOptionLabel(opt) }
          : { value: opt.value, label: opt.label ?? formatOptionLabel(opt.value) },
      ),
    [options],
  );

  const labelMap = useMemo(
    () =>
      formattedOptions.reduce<Record<string, string>>((map, opt) => {
        map[opt.value] = opt.label;
        return map;
      }, {}),
    [formattedOptions],
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: PointerEvent) => {
      const inTrigger = wrapRef.current && wrapRef.current.contains(e.target as Node);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target as Node);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [open]);

  // Keep the portaled dropdown anchored to the trigger so it never gets clipped
  // by a scrollable or overflow-hidden ancestor panel.
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!wrapRef.current) return;
      setRect(wrapRef.current.getBoundingClientRect());
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <div className='scrubber' ref={wrapRef} style={{ position: "relative" }}>
      <button
        type='button'
        className='scrubber-track scrubber-track--select'
        aria-label={title}
        aria-disabled={isDisabled}
        data-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        onClick={() => !isDisabled && setOpen((o) => !o)}
      >
        <span className='scrubber-label'>{title}</span>
        <span className='scrubber-select-right'>
          <span className='scrubber-value'>{labelMap[value] || value}</span>
          <svg
            className={`scrubber-caret${open ? " scrubber-caret--open" : ""}`}
            width='14'
            height='14'
            viewBox='0 0 16 16'
            fill='none'
          >
            <path
              d='M4 6l4 4 4-4'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </span>
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={dropdownRef}
            className='scrubber-dropdown'
            style={{
              position: "fixed",
              top: rect.bottom + 4,
              left: rect.left,
              right: "auto",
              width: rect.width,
              zIndex: 9999,
            }}
          >
            {formattedOptions.map((opt) => (
              <button
                key={opt.value}
                type='button'
                className={`scrubber-dropdown-item${opt.value === value ? " scrubber-dropdown-item--active" : ""}`}
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function PreviewInput({
  title = "",
  value = "",
  placeholder = "",
  isDisabled = false,
  onChange,
}: {
  title?: string;
  value?: string;
  placeholder?: string;
  isDisabled?: boolean;
  onChange?: (value: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value);

  return (
    <div className='scrubber'>
      <div className='scrubber-track scrubber-track--input' data-disabled={isDisabled}>
        <span className='scrubber-label' title={title}>
          {title}
        </span>
        <input
          className='scrubber-input'
          type='text'
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isDisabled}
          aria-label={title}
          title={value ?? undefined}
        />
      </div>
    </div>
  );
}

/* Docs toolbar (TabsLayout) minus router/favorites; animated pill included. */

function usePill(trackRef: React.RefObject<HTMLDivElement | null>, selection: string) {
  const [pill, setPill] = useState<
    { x: number; width: number; hidden: boolean; ready: boolean } | null
  >(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const measure = () => {
      const active = track.querySelector('[aria-selected="true"], [aria-pressed="true"]');
      setPill((previous) => {
        if (!active) return previous ? { ...previous, hidden: true } : null;
        const next = {
          x: (active as HTMLElement).offsetLeft,
          width: (active as HTMLElement).offsetWidth,
          hidden: false,
          ready: Boolean(previous),
        };
        const same = previous && previous.x === next.x && previous.width === next.width && !previous.hidden;
        return same ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [trackRef, selection]);

  return pill;
}

function Pill({ pill }: { pill: ReturnType<typeof usePill> }) {
  return (
    <span
      className='docs-pill'
      aria-hidden='true'
      data-ready={pill?.ready ? "" : undefined}
      style={
        pill
          ? { width: pill.width, transform: `translateX(${pill.x}px)`, opacity: pill.hidden ? 0 : 1 }
          : { opacity: 0 }
      }
    />
  );
}

export function DocsToolbar({
  activeTab,
  onTabChange,
  previewWidth,
  onPreviewWidthChange,
  actions,
  variantTabs,
}: {
  activeTab: "preview" | "code";
  onTabChange: (tab: "preview" | "code") => void;
  previewWidth: number | null;
  onPreviewWidthChange: (width: number | null) => void;
  actions?: ReactNode;
  variantTabs?: ReactNode;
}) {
  const tabsTrackRef = useRef<HTMLDivElement>(null);
  const sizeTrackRef = useRef<HTMLDivElement>(null);
  const tabsPill = usePill(tabsTrackRef, activeTab);
  const sizePill = usePill(sizeTrackRef, `${previewWidth}`);

  const canFullscreen =
    typeof document !== "undefined" &&
    Boolean(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);

  const openFullscreen = useCallback(() => {
    const demo = document.querySelector<HTMLElement>(".demo-container");
    const request = demo?.requestFullscreen || (demo as any)?.webkitRequestFullscreen;
    if (!request) return;
    Promise.resolve(request.call(demo)).catch(() => undefined);
  }, []);

  return (
    <div className='docs-toolbar'>
      <div
        className='docs-track docs-tabs'
        ref={tabsTrackRef}
        role='tablist'
        data-pill=''
      >
        <Pill pill={tabsPill} />
        <button
          type='button'
          role='tab'
          className='docs-segment'
          aria-selected={activeTab === "preview"}
          onClick={() => onTabChange("preview")}
        >
          <EyeIcon />
          Preview
        </button>
        <button
          type='button'
          role='tab'
          className='docs-segment'
          aria-selected={activeTab === "code"}
          onClick={() => onTabChange("code")}
        >
          <CodeIcon />
          Code
        </button>
      </div>
      {variantTabs}

      <div className='docs-toolbar-actions'>
        <div
          className='docs-track'
          role='group'
          aria-label='Preview size'
          ref={sizeTrackRef}
          data-pill=''
        >
          <Pill pill={sizePill} />
          {(
            [
              { label: "Desktop", width: null, Icon: MonitorIcon },
              { label: "Tablet · 768px", width: 768, Icon: TabletIcon },
              { label: "Mobile · 375px", width: 375, Icon: PhoneIcon },
            ] as const
          ).map(
            (preset) =>
              (preset.width === null || (preset.width ?? 0) < 1200) && (
                <button
                  key={preset.label}
                  type='button'
                  className='docs-segment docs-segment--icon'
                  aria-label={preset.label}
                  aria-pressed={previewWidth === preset.width}
                  title={preset.label}
                  onClick={() => onPreviewWidthChange(preset.width)}
                >
                  <preset.Icon />
                </button>
              ),
          )}
        </div>

        <div className='docs-track' role='group' aria-label='Page actions'>
          {actions}
          {canFullscreen && (
            <button
              type='button'
              className='docs-segment docs-segment--icon'
              aria-label='Fullscreen'
              title='Fullscreen'
              onClick={openFullscreen}
            >
              <MaximizeIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Lucide icons standing in for @hugeicons/react (same 16px stroke role). */
const EyeIcon = () => <Eye />;
const CodeIcon = () => <SquareCode />;
const MonitorIcon = () => <Monitor />;
const TabletIcon = () => <Tablet />;
const PhoneIcon = () => <Smartphone />;
const MaximizeIcon = () => <Maximize />;
