import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [command]);
  return (
    <Button type='button' variant='outline' size='sm' className='font-mono text-xs' onClick={copy}>
      {copied ? <CheckIcon className='text-green-600' /> : <CopyIcon />}
      {copied ? "copied" : command}
    </Button>
  );
}

function ConfigRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='border-input bg-background/50 flex items-center justify-between gap-3 rounded-md border px-3 py-1.5'>
      <Label className='text-muted-foreground min-w-0 truncate text-xs font-normal'>
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <ConfigRow label={label}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </ConfigRow>
  );
}

export function SelectRow({
  label,
  value,
  options,
  onChange,
  className = "w-40",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <ConfigRow label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`h-7 text-xs ${className}`} size='sm'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className='text-xs'>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ConfigRow>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  format = (current: number) => String(current),
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (current: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <ConfigRow label={label}>
      <div className='flex w-44 items-center gap-2'>
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(values) => onChange(values[0] ?? min)}
          className='grow'
        />
        <span className='w-14 text-right font-mono text-xs tabular-nums'>{format(value)}</span>
      </div>
    </ConfigRow>
  );
}

export function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <ConfigRow label={label}>
      <Input
        type='number'
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(Math.max(min, Math.min(max, parsed)));
        }}
        className='h-7 w-16 px-2 text-right text-xs'
      />
    </ConfigRow>
  );
}

export function TextRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ConfigRow label={label}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='h-7 max-w-52 text-right text-xs'
      />
    </ConfigRow>
  );
}

export function ConfigGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='space-y-2'>
      <Label className='text-foreground/80 text-[11px] font-semibold tracking-wider uppercase'>
        {title}
      </Label>
      <div className='grid gap-2'>{children}</div>
    </div>
  );
}
