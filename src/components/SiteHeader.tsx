import Logo from "./Logo";
import { APP_VERSION } from "../lib/defaults";

const NAV_LINKS = [
  { label: "Docs", href: "https://docs.testkube.io" },
  { label: "GitHub", href: "https://github.com/kubeshop/testkube" },
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-tk-border bg-tk-bg">
      <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-6 px-8 py-5">
        <div className="flex min-w-0 items-center gap-8">
          <a
            href="https://app.testkube.io"
            className="flex shrink-0 items-center gap-3"
            target="_blank"
            rel="noreferrer"
          >
            <Logo height={43} />
            <span className="text-sm font-medium text-white">Initializer</span>
          </a>

          <nav className="hidden items-center gap-5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-normal text-tk-muted transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-tk border border-tk-border bg-tk-slate-800/50 px-3 py-1 text-xs font-normal text-tk-muted sm:inline">
            v{APP_VERSION}
          </span>
          <a
            href="https://docs.testkube.io"
            target="_blank"
            rel="noreferrer"
            className="tk-site-header__btn tk-site-header__btn--outline hidden sm:inline-flex"
          >
            Documentation
          </a>
          <a
            href="https://testkube.io/demo"
            target="_blank"
            rel="noreferrer"
            className="tk-site-header__btn tk-site-header__btn--primary"
          >
            Get a Demo
          </a>
        </div>
      </div>
    </header>
  );
}
