import { ExternalLinkIcon, MoonIcon, SunIcon } from "lucide-react";

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { PlaygroundPage } from "@/playground/playground-page";

function NavThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type='button'
      className='docs-tool docs-tool--icon'
      aria-label='Toggle theme'
      title='Toggle theme'
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme='dark'>
      <div className='bg-[var(--bg-body)] text-(--text-primary) min-h-screen'>
        <div className='border-b border-(--border-subtle)'>
          <div className='mx-auto flex h-12 max-w-4xl items-center justify-between px-6'>
            <span className='font-mono text-sm'>@advanced-combobox</span>
            <div className='flex items-center gap-1.5'>
              <NavThemeToggle />
              <a
                href='https://github.com/FernaandoJr/advanced-combobox'
                target='_blank'
                rel='noreferrer'
                className='docs-tool docs-tool--icon'
                aria-label='GitHub repository'
                title='GitHub repository'
              >
                <ExternalLinkIcon />
              </a>
            </div>
          </div>
        </div>

        <div className='mx-auto max-w-6xl px-6 pb-16 pt-20'>
          <PlaygroundPage />
          <footer className='pt-10 pb-2 text-center text-xs text-(--text-dimmed)'>
            Component code installed from this repo's own shadcn registry.
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}
