import { ExternalLinkIcon } from "lucide-react";

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaygroundPage } from "@/playground/playground-page";
import { InstallCommand } from "@/playground/controls";

function ThemeToggle() {
  const { setTheme } = useTheme();
  return (
    <Button
      variant='ghost'
      size='icon'
      className='h-8 w-8'
      title='Toggle theme'
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      }}
    >
      <span className='hidden dark:block'>🌙</span>
      <span className='dark:hidden'>☀️</span>
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme='dark'>
      <div className='bg-background text-foreground min-h-screen'>
        <div className='border-b'>
          <div className='mx-auto flex h-12 max-w-5xl items-center justify-between px-6'>
            <span className='font-mono text-sm'>@advanced-combobox</span>
            <div className='flex items-center gap-1.5'>
              <Badge variant='secondary' className='text-[10px]'>
                shadcn registry
              </Badge>
              <Badge variant='outline' className='text-[10px]'>
                v0.1
              </Badge>
              <ThemeToggle />
              <Button asChild variant='ghost' size='icon' className='h-8 w-8'>
                <a
                  href='https://github.com/FernaandoJr/advanced-combobox'
                  target='_blank'
                  rel='noreferrer'
                >
                  <ExternalLinkIcon className='h-4' />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <main className='mx-auto max-w-5xl space-y-6 px-6 py-10'>
          <header className='space-y-3'>
            <h1 className='scroll-m-20 text-3xl font-semibold tracking-tight'>
              Advanced Combobox
            </h1>
            <p className='text-sm max-w-2xl text-muted-foreground'>
              A list and tree combobox for the shadcn registry: remote options with a shared,
              deduplicated cache, client or server pagination and cascading trees.
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              <InstallCommand command='npx shadcn add https://fernaandojr.github.io/advanced-combobox/r/combobox.json' />
              <Button asChild variant='outline' size='sm'>
                <a
                  href='https://github.com/FernaandoJr/advanced-combobox'
                  target='_blank'
                  rel='noreferrer'
                >
                  Repository
                </a>
              </Button>
            </div>
          </header>

          <PlaygroundPage />
        </main>
      </div>
    </ThemeProvider>
  );
}
