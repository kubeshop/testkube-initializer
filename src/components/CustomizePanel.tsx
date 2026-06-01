import { useState } from "react";
import { Field, Select, TextInput, Toggle } from "./ui";
import { advancedFieldsFor, type AdvancedFieldDef } from "../lib/advancedFields";
import { tipFor } from "../lib/tips";
import type { AdvancedScalar, TestkubeConfig } from "../types/config";

function AdvancedFieldInput({
  def,
  value,
  tip,
  onChange,
}: {
  def: AdvancedFieldDef;
  value: AdvancedScalar | undefined;
  tip?: string;
  onChange: (v: AdvancedScalar) => void;
}) {
  if (def.type === "boolean") {
    return (
      <Toggle
        label={def.label}
        description={tip}
        checked={Boolean(value)}
        onChange={onChange}
      />
    );
  }

  const hint = tip ? `${tip} (${def.path})` : def.path;

  if (def.type === "select") {
    return (
      <Field label={def.label} hint={hint}>
        <Select
          value={String(value ?? def.options?.[0]?.value ?? "")}
          onChange={onChange}
          options={def.options ?? []}
        />
      </Field>
    );
  }

  return (
    <Field label={def.label} hint={hint}>
      <TextInput
        type={def.type === "number" ? "number" : "text"}
        placeholder={def.placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export default function CustomizePanel({
  stepId,
  config,
  setAdvanced,
}: {
  stepId: string;
  config: TestkubeConfig;
  setAdvanced: (path: string, value: AdvancedScalar) => void;
}) {
  const [open, setOpen] = useState(false);
  const fields = advancedFieldsFor(stepId, config);
  if (fields.length === 0) return null;

  const setCount = fields.filter((f) => {
    const v = config.advanced[f.path];
    return v !== undefined && v !== "" && v !== false;
  }).length;

  return (
    <div className="rounded-tk border border-dashed border-tk-purple-500/50 bg-tk-purple-900/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-tk-purple-100">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M11.5 2a1 1 0 00-1 1v1.07a6 6 0 00-1.6.66l-.76-.76a1 1 0 00-1.41 0l-1.06 1.06a1 1 0 000 1.41l.76.76c-.29.5-.51 1.04-.66 1.6H4a1 1 0 00-1 1v1.5a1 1 0 001 1h1.07c.15.56.37 1.1.66 1.6l-.76.76a1 1 0 000 1.41l1.06 1.06a1 1 0 001.41 0l.76-.76c.5.29 1.04.51 1.6.66V17a1 1 0 001 1H13a1 1 0 001-1v-1.07a6 6 0 001.6-.66l.76.76a1 1 0 001.41 0l1.06-1.06a1 1 0 000-1.41l-.76-.76c.29-.5.51-1.04.66-1.6H17a1 1 0 001-1V10a1 1 0 00-1-1h-.01a6 6 0 00-.65-1.6l.76-.76a1 1 0 000-1.41l-1.06-1.06a1 1 0 00-1.41 0l-.76.76a6 6 0 00-1.6-.66V3a1 1 0 00-1-1h-1.5zM10 13a3 3 0 110-6 3 3 0 010 6z" />
          </svg>
          Customize advanced values
          {setCount > 0 && (
            <span className="rounded-full bg-tk-purple-500 px-2 py-0.5 text-xs font-bold text-white">
              {setCount}
            </span>
          )}
        </span>
        <span className="text-tk-purple-200">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-tk-purple-600/40 px-5 py-4">
          <p className="text-xs text-tk-purple-200/70">
            Optional overrides applied verbatim to your{" "}
            <code className="text-tk-pink">values.yaml</code>. Hints come from the
            official Testkube chart comments.
          </p>
          {fields.map((f) => (
            <AdvancedFieldInput
              key={f.path}
              def={f}
              value={config.advanced[f.path]}
              tip={tipFor(config.initial.envType, f.path)}
              onChange={(v) => setAdvanced(f.path, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
