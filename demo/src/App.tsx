import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header/site-header";
import { PlaygroundPage } from "@/playground/playground-page";

export default function App() {
  return (
    <ThemeProvider defaultTheme='dark'>
      <div className='bg-[var(--bg-body)] text-(--text-primary) min-h-screen'>
        <SiteHeader />

        <div className='mx-auto max-w-6xl px-6 pb-16 pt-24'>
          <PlaygroundPage />
        </div>
      </div>
    </ThemeProvider>
  );
}
