import { useCallback, useEffect, useMemo, useState } from "react";
import Logo from "./components/Logo";
import { APP_VERSION, defaultConfig } from "./lib/defaults";
import { STEPS } from "./lib/steps";
import { downloadYaml } from "./lib/yaml";
import { HelpContext, type FieldHelp } from "./lib/helpContext";
import PreviewDrawer from "./components/PreviewDrawer";
import { validate } from "./lib/validation";
import type { AdvancedScalar, TestkubeConfig } from "./types/config";
import InitialConfigStep from "./steps/InitialConfigStep";
import CoreComponentsStep from "./steps/CoreComponentsStep";
import DatabaseStep from "./steps/DatabaseStep";
import ArtifactsStoreStep from "./steps/ArtifactsStoreStep";
import NatsStep from "./steps/NatsStep";
import AuthenticationStep from "./steps/AuthenticationStep";
import EndpointsStep from "./steps/EndpointsStep";
import OverviewStep from "./steps/OverviewStep";
import type { StepProps } from "./steps/types";

const STEP_COMPONENTS: ((p: StepProps) => JSX.Element)[] = [
  InitialConfigStep,
  CoreComponentsStep,
  DatabaseStep,
  ArtifactsStoreStep,
  NatsStep,
  AuthenticationStep,
  EndpointsStep,
  OverviewStep,
];

export default function App() {
  const [config, setConfig] = useState<TestkubeConfig>(defaultConfig);
  const [active, setActive] = useState(0);
  const [fieldHelp, setFieldHelp] = useState<FieldHelp | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  // Validation stays dormant until the user reaches the Overview step, so the
  // wizard doesn't greet them with errors. Once activated it remains on.
  const [validationActive, setValidationActive] = useState(false);

  // Reset the contextual help whenever the wizard step changes.
  useEffect(() => setFieldHelp(null), [active]);
  useEffect(() => {
    if (active === STEPS.length - 1) setValidationActive(true);
  }, [active]);

  const update = useCallback(
    <K extends keyof TestkubeConfig>(key: K, patch: Partial<TestkubeConfig[K]>) => {
      setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    },
    []
  );

  const setAdvanced = useCallback((path: string, value: AdvancedScalar) => {
    setConfig((prev) => ({
      ...prev,
      advanced: { ...prev.advanced, [path]: value },
    }));
  }, []);

  const meta = STEPS[active];
  const StepComponent = STEP_COMPONENTS[active];
  const isLast = active === STEPS.length - 1;

  const validation = useMemo(() => validate(config), [config]);
  const hasErrors = validationActive && validation.errors.length > 0;
  const errorsByStep = useMemo(() => {
    const m: Record<number, number> = {};
    if (!validationActive) return m;
    for (const e of validation.errors) m[e.step] = (m[e.step] ?? 0) + 1;
    return m;
  }, [validation, validationActive]);

  return (
    <HelpContext.Provider value={setFieldHelp}>
    <div className="flex min-h-screen flex-col bg-tk-purple-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-tk-purple-600/50 bg-black/40 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-lg font-extrabold leading-none">
              Testkube <span className="text-tk-pink">Initializer</span>
            </h1>
            <p className="text-xs text-tk-purple-200/70">Helm values generator</p>
          </div>
        </div>
        <span className="rounded-full border border-tk-yellow/60 bg-tk-yellow/10 px-3 py-1 text-xs font-bold text-tk-yellow">
          Version: {APP_VERSION}
        </span>
      </header>

      {/* Main 3-column layout */}
      <main className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 gap-5 p-5 lg:grid-cols-[220px_1fr_260px]">
        {/* Wizard nav */}
        <nav className="rounded-tk border border-tk-purple-600/60 bg-tk-purple-800/40 p-3">
          <h2 className="px-2 pb-2 pt-1 text-sm font-bold uppercase tracking-wide text-tk-purple-200">
            Wizard
          </h2>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={
                      "flex w-full items-center gap-2 rounded-tk-md px-3 py-2 text-left text-sm transition " +
                      (isActive
                        ? "bg-tk-purple-500 font-semibold text-white shadow-tk"
                        : "text-tk-purple-200 hover:bg-tk-purple-600/40")
                    }
                  >
                    <span
                      className={
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                        (isActive
                          ? "bg-white text-tk-purple-600"
                          : "bg-tk-purple-700 text-tk-purple-200")
                      }
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1">{s.title}</span>
                    {errorsByStep[i] > 0 && (
                      <span
                        title={`${errorsByStep[i]} error(s)`}
                        className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-tk-error px-1 text-xs font-bold text-white"
                      >
                        {errorsByStep[i]}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Configuration panel */}
        <section className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">{meta.panelTitle}</h2>
          </div>
          <div className="flex-1">
            <StepComponent
              config={config}
              update={update}
              setAdvanced={setAdvanced}
              goToStep={setActive}
            />
          </div>

          {/* Prev / Next */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
              className="rounded-full border border-tk-purple-400 px-5 py-2 text-sm font-semibold text-tk-purple-200 transition hover:bg-tk-purple-500/20 disabled:opacity-30"
            >
              ← Back
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => downloadYaml(config)}
                disabled={hasErrors}
                title={hasErrors ? `Resolve ${validation.errors.length} error(s) to export` : undefined}
                className="rounded-full bg-tk-yellow px-6 py-2 text-sm font-bold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export values.yaml
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActive((a) => Math.min(STEPS.length - 1, a + 1))}
                className="rounded-full bg-tk-purple-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-tk-purple-400"
              >
                Next →
              </button>
            )}
          </div>
        </section>

        {/* Help panel */}
        <aside className="self-start rounded-tk border border-tk-purple-600/60 bg-tk-purple-800/40 p-4 lg:sticky lg:top-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tk-purple-200">
            Helpful links & explanations
          </h2>

          {fieldHelp && (
            <div className="mb-4 rounded-tk-md border border-tk-purple-400/50 bg-tk-purple-500/10 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-tk-pink">
                Field
              </p>
              <h3 className="text-sm font-bold text-white">{fieldHelp.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-tk-purple-100/90">
                {fieldHelp.body || "No additional guidance for this field."}
              </p>
              {fieldHelp.path && (
                <code className="mt-2 block break-all text-xs text-tk-purple-200/80">
                  {fieldHelp.path}
                </code>
              )}
            </div>
          )}

          <div className="space-y-3 text-sm leading-relaxed text-tk-purple-100/90">
            {meta.help.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
          </div>
          {meta.links.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-tk-purple-600/40 pt-4">
              {meta.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-semibold text-tk-pink hover:underline"
                >
                  → {l.label}
                </a>
              ))}
            </div>
          )}
        </aside>
      </main>

      {/* Sticky bottom: live YAML preview + actions */}
      <div className="sticky bottom-0 z-30">
        <PreviewDrawer
          config={config}
          open={previewOpen}
          onToggle={() => setPreviewOpen((o) => !o)}
          validateActive={validationActive}
        />
        <footer className="border-t border-tk-purple-600/50 bg-black/40 px-6 py-4">
          <div className="mx-auto flex max-w-[1200px] items-center justify-end gap-3">
            {hasErrors && (
              <span className="text-xs font-semibold text-tk-error">
                {validation.errors.length} error
                {validation.errors.length > 1 ? "s" : ""} to resolve before export
              </span>
            )}
            <button
              type="button"
              onClick={() => downloadYaml(config)}
              disabled={hasErrors}
              title={hasErrors ? `Resolve ${validation.errors.length} error(s) to export` : undefined}
              className="rounded-full bg-tk-yellow px-6 py-2 text-sm font-bold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Export
            </button>
          </div>
        </footer>
      </div>
    </div>
    </HelpContext.Provider>
  );
}
