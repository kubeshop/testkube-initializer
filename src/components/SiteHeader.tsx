import Logo from "./Logo";
import { APP_VERSION } from "../lib/defaults";

const NAV_LINKS = [
  { label: "Platform", href: "https://testkube.io" },
  { label: "Docs", href: "https://docs.testkube.io" },
  { label: "GitHub", href: "https://github.com/kubeshop/testkube" },
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-tk-purple-200/15 bg-tk-purple-900/80 backdrop-blur-xl">
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
              className="text-sm font-semibold text-tk-purple-200/80 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden rounded-full border border-tk-purple-200/20 bg-tk-surface/50 px-3 py-1 text-[11px] font-semibold text-tk-purple-200/70 sm:inline">
            Initializer · v{APP_VERSION}
          </span>
          <a
            href="https://testkube.io"
            target="_blank"
            rel="noreferrer"
            className="hidden tk-btn-outline px-4 py-2 text-sm sm:inline-flex"
          >
            testkube.io
          </a>
          <a
            href="https://testkube.io/demo"
            target="_blank"
            rel="noreferrer"
            className="tk-btn-demo px-4 py-2 text-sm"
          >
            Get a Demo
          </a>
        </div>
      </div>
    </header>
  );
}
