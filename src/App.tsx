import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "./components/SiteHeader";
import { captureEvent, wizardSessionSeconds } from "./lib/analytics";
import {
  safeConfigSnapshot,
  trackAdvancedFieldChange,
  trackConfigUpdate,
} from "./lib/analyticsConfig";
import { defaultConfig } from "./lib/defaults";
import { STEPS } from "./lib/steps";
import { downloadYaml } from "./lib/yaml";
import { HelpContext, type FieldHelp } from "./lib/helpContext";
import FeedbackModal from "./components/FeedbackModal";
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

type DownloadSource = "overview" | "preview_drawer";

export default function App() {
  const [config, setConfig] = useState<TestkubeConfig>(defaultConfig);
  const [active, setActive] = useState(0);
  const [fieldHelp, setFieldHelp] = useState<FieldHelp | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [validationActive, setValidationActive] = useState(false);
  const prevEnvType = useRef(config.initial.envType);
  const activeRef = useRef(active);
  const configRef = useRef(config);
  const wizardCompletedRef = useRef(false);
  const validationShownRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
    configRef.current = config;
  }, [active, config]);

  useEffect(() => setFieldHelp(null), [active]);
  useEffect(() => {
    if (active === STEPS.length - 1) setValidationActive(true);
  }, [active]);

  useEffect(() => {
    const step = STEPS[active];
    captureEvent("step_viewed", {
      step: active + 1,
      step_id: step.id,
      env_type: config.initial.envType,
    });
  }, [active, config.initial.envType]);

  useEffect(() => {
    if (prevEnvType.current === config.initial.envType) return;
    captureEvent("env_type_selected", { env_type: config.initial.envType });
    prevEnvType.current = config.initial.envType;
  }, [config.initial.envType]);

  useEffect(() => {
    if (active !== STEPS.length - 1 || wizardCompletedRef.current) return;
    wizardCompletedRef.current = true;
    captureEvent("wizard_completed", {
      env_type: config.initial.envType,
      duration_seconds: wizardSessionSeconds(),
    });
  }, [active, config.initial.envType]);

  useEffect(() => {
    if (active !== STEPS.length - 1) return;
    const errors = validate(config).errors;
    if (errors.length === 0 || validationShownRef.current) return;
    validationShownRef.current = true;
    captureEvent("validation_errors_shown", {
      error_count: errors.length,
      step_ids: [...new Set(errors.map((e) => STEPS[e.step]?.id ?? String(e.step)))].join(","),
      env_type: config.initial.envType,
    });
  }, [active, config]);

  useEffect(() => {
    const onLeave = () => {
      captureEvent("wizard_abandoned", {
        last_step_id: STEPS[activeRef.current].id,
        last_step: activeRef.current + 1,
        env_type: configRef.current.initial.envType,
        duration_seconds: wizardSessionSeconds(),
      });
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  const navigateToStep = useCallback(
    (next: number, via: "nav" | "next" | "back") => {
      setActive((current) => {
        if (next === current) return current;
        const props = {
          from_step_id: STEPS[current].id,
          to_step_id: STEPS[next].id,
          env_type: configRef.current.initial.envType,
        };
        if (via === "nav") captureEvent("step_jump_clicked", props);
        if (via === "next") captureEvent("step_next_clicked", props);
        if (via === "back") captureEvent("step_back_clicked", props);
        return next;
      });
    },
    []
  );

  const update = useCallback(
    <K extends keyof TestkubeConfig>(key: K, patch: Partial<TestkubeConfig[K]>) => {
      setConfig((prev) => {
        trackConfigUpdate(key, patch, prev);
        return { ...prev, [key]: { ...prev[key], ...patch } };
      });
    },
    []
  );

  const setAdvanced = useCallback((path: string, value: AdvancedScalar) => {
    setConfig((prev) => {
      trackAdvancedFieldChange(prev, path, STEPS[activeRef.current].id);
      return {
        ...prev,
        advanced: { ...prev.advanced, [path]: value },
      };
    });
  }, []);

  const handleDownloadYaml = useCallback(
    (source: DownloadSource = "overview") => {
      const errorCount = validate(config).errors.length;
      if (errorCount > 0) {
        captureEvent("validation_blocked_export", {
          env_type: config.initial.envType,
          validation_errors: errorCount,
          source,
        });
        return;
      }
      const snapshot = safeConfigSnapshot(config);
      captureEvent("yaml_downloaded", { ...snapshot, source });
      captureEvent("config_exported", { ...snapshot, source });
      downloadYaml(config);
      setFeedbackOpen(true);
    },
    [config]
  );

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
    <div className="tk-site-bg flex min-h-screen flex-col text-white">
      <SiteHeader />

      <div className="border-b border-tk-purple-200/10 px-5 py-6 text-center lg:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tk-purple-200/60">
          Helm values generator
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Configure your <span className="text-tk-purple-200">Testkube</span> deployment
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-tk-purple-200/75">
          Generate a ready-to-use <code className="text-tk-yellow">values.yaml</code> for OSS or
          Enterprise.
        </p>
      </div>

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 gap-5 px-5 pb-20 pt-2 lg:grid-cols-[220px_1fr_260px] lg:px-6">
        <nav className="tk-panel p-3">
          <h2 className="px-2 pb-2 pt-1 text-sm font-bold uppercase tracking-wide text-tk-purple-200/70">
            Wizard
          </h2>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigateToStep(i, "nav")}
                    className={
                      "flex w-full items-center gap-2 rounded-tk-md px-3 py-2 text-left text-sm transition " +
                      (isActive
                        ? "bg-tk-yellow font-bold text-black shadow-sm"
                        : "text-tk-purple-200/80 hover:bg-tk-purple-500/20 hover:text-white")
                    }
                  >
                    <span
                      className={
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                        (isActive
                          ? "bg-black text-tk-yellow"
                          : "bg-tk-purple-600/50 text-tk-purple-200")
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

        <section className="tk-panel flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">{meta.panelTitle}</h2>
          </div>
          <div className="flex-1">
            <StepComponent
              config={config}
              update={update}
              setAdvanced={setAdvanced}
              goToStep={(step) => navigateToStep(step, "nav")}
              onDownloadYaml={() => handleDownloadYaml("overview")}
            />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-tk-purple-200/15 pt-5">
            <button
              type="button"
              onClick={() => navigateToStep(Math.max(0, active - 1), "back")}
              disabled={active === 0}
              className="tk-btn-outline"
            >
              ← Back
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => handleDownloadYaml("overview")}
                disabled={hasErrors}
                title={hasErrors ? `Resolve ${validation.errors.length} error(s) to export` : undefined}
                className="tk-btn-demo"
              >
                Export values.yaml
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateToStep(Math.min(STEPS.length - 1, active + 1), "next")}
                className="tk-btn-demo"
              >
                Next →
              </button>
            )}
          </div>
        </section>

        <aside className="tk-panel self-start p-4 lg:sticky lg:top-[var(--tk-nav-height)]">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-tk-purple-200/70">
            Helpful links & explanations
          </h2>

          {fieldHelp && (
            <div className="mb-4 rounded-tk-md border border-tk-purple-200/25 bg-tk-purple-500/15 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-tk-pink">
                Field
              </p>
              <h3 className="text-sm font-bold text-white">{fieldHelp.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-tk-purple-200/85">
                {fieldHelp.body || "No additional guidance for this field."}
              </p>
              {fieldHelp.path && (
                <code className="mt-2 block break-all text-xs text-tk-purple-200/60">
                  {fieldHelp.path}
                </code>
              )}
            </div>
          )}

          <div className="space-y-3 text-sm leading-relaxed text-tk-purple-200/80">
            {meta.help.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
          </div>
          {meta.links.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-tk-purple-200/15 pt-4">
              {meta.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="tk-link block text-sm"
                >
                  → {l.label}
                </a>
              ))}
            </div>
          )}
        </aside>
      </main>

      <PreviewDrawer
        config={config}
        open={previewOpen}
        onToggle={() => {
          setPreviewOpen((o) => {
            captureEvent("preview_drawer_toggled", {
              open: !o,
              env_type: config.initial.envType,
            });
            return !o;
          });
        }}
        validateActive={validationActive}
        onDownloadYaml={() => handleDownloadYaml("preview_drawer")}
      />
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSkip={() =>
          captureEvent("feedback_skipped", { env_type: config.initial.envType })
        }
        config={config}
      />
    </div>
    </HelpContext.Provider>
  );
}
