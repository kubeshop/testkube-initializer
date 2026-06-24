import Logo from "./Logo";
import { APP_VERSION } from "../lib/defaults";

const NAV_LINKS = [
  { label: "Platform", href: "https://testkube.io" },
  { label: "Docs", href: "https://docs.testkube.io" },
  { label: "GitHub", href: "https://github.com/kubeshop/testkube" },
] as const;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black">
      <div className="mx-auto flex w-full max-w-[90rem] items-start gap-8 px-6 py-4 sm:px-12">
        <a
          href="https://testkube.io"
          className="flex h-[2.85rem] w-48 shrink-0 items-center gap-2.5"
        >
          <Logo size={46} />
          <span className="text-base font-normal text-white">testkube</span>
        </a>

        <div className="flex min-h-[2.85rem] flex-1 items-center justify-between gap-8">
          <nav className="hidden items-center gap-4 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-normal leading-[1.45] text-tk-purple-200 transition hover:text-tk-yellow"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex h-[2.85rem] items-center gap-4">
            <span className="hidden rounded-full border border-tk-purple-200/20 bg-tk-purple-800/50 px-3 py-1 text-[11px] font-normal text-tk-purple-200/70 sm:inline">
              Initializer · v{APP_VERSION}
            </span>
            <a
              href="https://testkube.io"
              target="_blank"
              rel="noreferrer"
              className="tk-site-header__btn tk-site-header__btn--outline hidden sm:inline-flex"
            >
              testkube.io
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
      </div>
    </header>
  );
}
