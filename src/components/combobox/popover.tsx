import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Combobox-specific popover content rendered through the Radix Portal directly.
 *
 * Lives inside the item (instead of reusing `@/components/ui/popover`s
 * PopoverContent) because the official shadcn wrapper does not forward a portal
 * `container`, which the combobox needs to escape Dialog/Sheet overflow.
 */
export function ComboboxPopoverContent({
  container,
  className,
  children,
  align = "start",
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Portal container override (e.g. a Dialog content node when the popover must escape overflow). */
  container?: HTMLElement | null;
}) {
  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        data-combobox-content=''
        align={align}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          "p-0 w-(--radix-popover-trigger-width)",
          className,
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

