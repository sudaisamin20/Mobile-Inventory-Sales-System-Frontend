// components/ui/Input.tsx
// ─────────────────────────────────────────────
// Usage:
//   <Input label="Phone Name" placeholder="e.g. iPhone 15" />
//   <Input label="Price" type="number" prefix="PKR" />
//   <Input label="Search" suffix={<SearchIcon />} error="Required" />
//   <Select label="Brand" options={[{ value:"apple", label:"Apple" }]} />
//   <Textarea label="Description" rows={4} />
// ─────────────────────────────────────────────

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

// ── Shared wrapper ───────────────────────────

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldWrapper({ label, error, hint, required, children, className = "" }: FieldWrapperProps) {
  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      {label && (
        <label className="text-sm font-semibold text-gray-300">
          {label}
          {required && <span className="text-yellow-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400 flex items-center gap-1">⚠ {error}</p>}
      {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ── Input ────────────────────────────────────

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
  prefix?: ReactNode;   // e.g. "PKR" or icon on the left
  suffix?: ReactNode;   // e.g. icon on the right
  helper: string;
  isLoading?: boolean;
}

export function Input({ label, error, hint, prefix, suffix, required, className = "", ...props }: InputProps) {
  const inputBase = [
    "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600",
    "outline-none transition-all duration-200",
    "focus:bg-white/8 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20",
    error ? "border-red-500/50" : "border-white/10 hover:border-white/20",
  ].join(" ");

  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 text-sm text-gray-400 flex items-center pointer-events-none select-none">
            {prefix}
          </div>
        )}
        <input
          className={[inputBase, prefix ? "pl-10" : "", suffix ? "pr-10" : ""].join(" ")}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-sm text-gray-400 flex items-center">
            {suffix}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

// ── Select ───────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, hint, options, placeholder, required, className = "", ...props }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} className={className}>
      <select
        className={[
          "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white",
          "outline-none transition-all duration-200",
          "focus:bg-white/8 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20",
          "appearance-none cursor-pointer",
          error ? "border-red-500/50" : "border-white/10 hover:border-white/20",
          "[&>option]:bg-[#1a0a2e] [&>option]:text-white",
        ].join(" ")}
        {...props}
      >
        {placeholder && <option disabled value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

// ── Textarea ─────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, required, className = "", ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        className={[
          "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600",
          "outline-none transition-all duration-200 resize-none",
          "focus:bg-white/8 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20",
          error ? "border-red-500/50" : "border-white/10 hover:border-white/20",
          className,
        ].join(" ")}
        {...props}
      />
    </FieldWrapper>
  );
}

// ── Checkbox ─────────────────────────────────
// Usage:
//   <Checkbox label="Box included" checked={form.box} onChange={e => setForm({...form, box: e.target.checked})} />

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ label, checked, onChange, hint, disabled = false, className = "" }: CheckboxProps) {
  return (
    <label
      className={[
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer group",
        "bg-white/4 border border-white/10",
        "hover:bg-white/6 hover:border-white/20",
        "transition-all duration-200",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        {/* Custom checkbox box */}
        <div className={[
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
          checked
            ? "bg-yellow-400 border-yellow-400"
            : "bg-white/5 border-white/20 group-hover:border-white/40",
        ].join(" ")}>
          {checked && (
            <svg className="w-3 h-3 text-yellow-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className={[
          "text-sm font-medium transition-colors duration-200",
          checked ? "text-yellow-400" : "text-gray-300 group-hover:text-white",
        ].join(" ")}>
          {label}
        </span>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

// ── RangeSlider ───────────────────────────────
// Usage:
//   <RangeSlider label="Battery Health" value={85} onChange={v => setHealth(v)} unit="%" min={0} max={100} />

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function RangeSlider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", className = "" }: RangeSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";

  return (
    <div className={["space-y-2", className].join(" ")}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-300">{label}</label>
        <span className="text-sm font-black" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10">
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  );
}