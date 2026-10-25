import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

function Popover({
  open: openProp,
  onOpenChange,
  defaultOpen,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  return (
    <PopoverPrimitive.Root
      data-slot='popover'
      open={open}
      onOpenChange={(next) => {
        if (!isControlled) setInternalOpen(next);
        onOpenChange?.(next);
      }}
      {...props}
    />
  );
}

function PopoverTrigger({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return (
    <PopoverPrimitive.Trigger data-slot='popover-trigger' className={className} {...props} />
  );
}

function PopoverContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Portal container override (e.g. a Dialog content node when the popover must escape overflow). */
  container?: HTMLElement | null;
}) {
  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        data-slot='popover-content'
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
