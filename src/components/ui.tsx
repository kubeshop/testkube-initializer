import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-white">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-tk-purple-200/70">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-tk-md border border-tk-purple-600 bg-tk-purple-900/60 px-4 py-2.5 text-sm text-white placeholder:text-tk-purple-200/40 outline-none transition focus:border-tk-purple-400 focus:ring-2 focus:ring-tk-purple-500/40";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} className={inputBase} />;
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23cfc8fd'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-tk-purple-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-tk-md border border-tk-purple-600 bg-tk-purple-900/60 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "rounded-[0.45rem] px-4 py-1.5 text-sm font-semibold transition " +
              (active
                ? "bg-tk-purple-500 text-white shadow-tk"
                : "text-tk-purple-200 hover:bg-tk-purple-600/50")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        "flex w-full items-center justify-between gap-4 rounded-tk-md border px-4 py-3 text-left transition " +
        (checked
          ? "border-tk-purple-400 bg-tk-purple-500/15"
          : "border-tk-purple-600 bg-tk-purple-900/40 hover:border-tk-purple-400/60")
      }
    >
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-tk-purple-200/70">
            {description}
          </span>
        )}
      </span>
      <span
        className={
          "relative h-6 w-11 flex-shrink-0 rounded-full transition " +
          (checked ? "bg-tk-purple-500" : "bg-tk-purple-700")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " +
            (checked ? "left-[1.375rem]" : "left-0.5")
          }
        />
      </span>
    </button>
  );
}

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-tk border border-tk-purple-600/60 bg-tk-purple-800/40 p-5">
      {title && (
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-tk-purple-200">
          {title}
        </h3>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ResourceEditor({
  value,
  onChange,
}: {
  value: {
    requestsCpu: string;
    requestsMemory: string;
    limitsCpu: string;
    limitsMemory: string;
  };
  onChange: (patch: Partial<typeof value>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Requests CPU">
        <TextInput
          value={value.requestsCpu}
          onChange={(e) => onChange({ requestsCpu: e.target.value })}
        />
      </Field>
      <Field label="Requests Mem">
        <TextInput
          value={value.requestsMemory}
          onChange={(e) => onChange({ requestsMemory: e.target.value })}
        />
      </Field>
      <Field label="Limits CPU">
        <TextInput
          value={value.limitsCpu}
          onChange={(e) => onChange({ limitsCpu: e.target.value })}
        />
      </Field>
      <Field label="Limits Mem">
        <TextInput
          value={value.limitsMemory}
          onChange={(e) => onChange({ limitsMemory: e.target.value })}
        />
      </Field>
    </div>
  );
}
