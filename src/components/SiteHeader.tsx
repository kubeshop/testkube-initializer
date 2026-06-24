import Logo from "./Logo";
import { APP_VERSION } from "../lib/defaults";

const NAV_LINKS = [
  { label: "Platform", href: "https://testkube.io" },
  { label: "Docs", href: "https://docs.testkube.io" },
  { label: "GitHub", href: "https://github.com/kubeshop/testkube" },
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-tk-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-5 py-3 lg:px-6">
        <a href="https://testkube.io" className="flex shrink-0 items-center gap-2.5">
          <Logo size={28} />
          <span className="text-lg font-bold tracking-tight text-white">testkube</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/60 sm:inline">
            Initializer · v{APP_VERSION}
          </span>
          <a
            href="https://testkube.io"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 sm:inline-flex"
          >
            testkube.io
          </a>
          <a
            href="https://testkube.io/demo"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-tk-yellow px-4 py-2 text-sm font-bold text-tk-ink transition hover:bg-transparent hover:text-tk-yellow hover:ring-2 hover:ring-tk-yellow"
          >
            Get a Demo
          </a>
        </div>
      </div>
    </header>
  );
}
