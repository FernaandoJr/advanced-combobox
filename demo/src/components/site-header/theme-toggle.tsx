import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const toggleClass = cn(
  "group relative inline-flex h-8 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 outline-none",
  "bg-transparent text-(--text-muted) ring-transparent transition duration-200 ease-out",
  "hover:bg-(--bg-hover) hover:text-(--text-primary)",
  "focus-visible:bg-(--bg-body) focus-visible:text-(--text-primary) focus-visible:ring-1 focus-visible:ring-(--border-primary)",
  "cursor-pointer p-0 justify-center",
  "[&:not(:disabled)]:pointer-events-auto",
);

/** Icon with the spring-rotate feel from the portfolio's ModeToggle, via CSS only. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type='button'
      className={cn(toggleClass, "size-9 rounded-lg", className)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label='Toggle theme'
    >
      <span
        className='flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
        style={{
          transform: resolvedTheme === "dark" ? "rotate(0deg)" : "rotate(180deg)",
        }}
      >
        <SunIcon className='size-[1.2rem] dark:hidden' />
        <MoonIcon className='hidden size-[1.2rem] dark:block' />
      </span>
      <span className='sr-only'>Toggle theme</span>
    </button>
  );
}
