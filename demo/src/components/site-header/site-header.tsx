import { useState } from "react";
import { createPortal } from "react-dom";

import { Logo } from "@/components/site-header/logo";
import { MenuToggleIcon } from "@/components/site-header/menu-toggle-icon";
import { ThemeToggle } from "@/components/site-header/theme-toggle";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/FernaandoJr/advanced-combobox";

const NAV_LINKS = [
  { label: "GitHub", href: REPO_URL },
];

/** Neutral/ghost/small button styling from the portfolio's buttonVariants, mapped to demo tokens. */
const navLinkClass = cn(
  "group relative inline-flex h-9 items-center justify-center gap-3 whitespace-nowrap rounded-lg px-3 outline-none",
  "text-sm font-medium transition duration-200 ease-out",
  "bg-transparent text-(--text-muted) ring-transparent",
  "hover:bg-(--bg-hover) hover:text-(--text-primary)",
  "focus-visible:bg-(--bg-body) focus-visible:text-(--text-primary) focus-visible:ring-1 focus-visible:ring-(--border-primary)",
);

/** The portfolio site header, adapted to this demo (single language, `<a>` links). */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const scrolled = useScroll(10);

  return (
    <header className='fixed top-0 right-0 left-0 z-50 w-full'>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -bottom-16 transition-opacity duration-500 ease-out",
          "bg-linear-to-b from-(--bg-body)/85 via-(--bg-body)/60 to-transparent",
          "supports-[backdrop-filter]:backdrop-blur-lg",
          "[mask-image:linear-gradient(to_bottom,var(--bg-body)_45%,transparent)]",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />

      <nav className='relative mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-6 lg:px-0 select-none'>
        <div className='flex items-center gap-5'>
          <a
            href={REPO_URL}
            target='_blank'
            rel='noreferrer'
            className='flex items-center text-(--text-primary)'
            aria-label='GitHub repository'
          >
            <Logo className='size-5' />
          </a>
          <div className='hidden items-center gap-1 md:flex'>
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                className={navLinkClass}
                href={link.href}
                target='_blank'
                rel='noreferrer'
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className='hidden items-center gap-2 md:flex'>
          <ThemeToggle />
        </div>

        <button
          type='button'
          onClick={() => setOpen(!open)}
          className={cn(navLinkClass, "size-9 p-0 md:hidden")}
          aria-expanded={open}
          aria-controls='mobile-menu'
          aria-label='Open menu'
        >
          <MenuToggleIcon open={open} className='size-5' duration={300} />
        </button>
      </nav>

      <MobileMenu open={open}>
        <div className='flex flex-col gap-2'>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              className={cn(navLinkClass, "justify-start")}
              href={link.href}
              target='_blank'
              rel='noreferrer'
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className='flex items-center gap-2 pt-1'>
            <ThemeToggle />
          </div>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & { open: boolean };

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open) return null;

  return createPortal(
    <div
      id='mobile-menu'
      className={cn(
        "bg-(--bg-body)/95 supports-[backdrop-filter]:bg-(--bg-body)/50 backdrop-blur-lg",
        "fixed top-14 right-0 left-0 z-40 border-b border-(--border-subtle) md:hidden",
      )}
    >
      <div
        data-slot={open ? "open" : "closed"}
        className={cn(
          "mx-auto w-full max-w-3xl px-6 py-3 lg:px-0",
          "data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
