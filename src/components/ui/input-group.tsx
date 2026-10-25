import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='input-group'
      className={cn(
        "border-input dark:bg-input/30 group/input-group relative flex w-full min-w-0 items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot='input-group-input'
      className={cn(
        "flex w-full min-w-0 flex-1 rounded-none bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = "inline-start",
  children,
  ...props
}: React.ComponentProps<"div"> & { align?: "inline-start" | "inline-end" }) {
  return (
    <div
      data-slot='input-group-addon'
      data-align={align}
      className={cn(
        "text-muted-foreground flex h-8 w-9 items-center justify-center text-sm select-none [&>svg:not([class*='size-'])]:size-4",
        align === "inline-start" ? "order-first" : "order-last",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
