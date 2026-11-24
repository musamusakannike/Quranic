import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";

/* ── Button ──────────────────────────────────────────────────────────────── */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "subtle" | "danger" | "icon";
  size?: "sm" | "md";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "subtle",
  size = "md",
  className = "",
  type = "button",
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed select-none";
  const sizes =
    variant === "icon"
      ? size === "sm"
        ? "h-8 w-8 rounded-[6px]"
        : "h-9 w-9 rounded-[6px]"
      : size === "sm"
        ? "h-8 px-2.5 text-[13px] rounded-[6px]"
        : "h-9 px-3.5 text-[14px] rounded-[6px]";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
    subtle:
      "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    ghost:
      "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    danger:
      "bg-transparent border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white",
    icon:
      "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  };

  return (
    <button
      type={type}
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
      {...rest}
    />
  );
};

/* ── SegmentedControl ────────────────────────────────────────────────────── */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center p-0.5 rounded-[8px] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`h-8 px-3 text-[13px] font-medium rounded-[6px] transition-colors duration-150 cursor-pointer ${
              active
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-border)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-transparent"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}> = ({ checked, onChange, ariaLabel, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 cursor-pointer disabled:opacity-45 ${
      checked
        ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
        : "bg-[var(--color-surface-2)] border-[var(--color-border)]"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-150 ${
        checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-1 rtl:-translate-x-1"
      }`}
    />
  </button>
);

/* ── Slider ──────────────────────────────────────────────────────────────── */

export const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  readout?: string;
}> = ({ value, min, max, step = 1, onChange, ariaLabel, readout }) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 flex-1 cursor-pointer accent-[var(--color-primary)]"
    />
    {readout && (
      <span className="min-w-[48px] text-end text-[13px] tabular-nums text-[var(--color-text-muted)]">
        {readout}
      </span>
    )}
  </div>
);

/* ── Dialog ──────────────────────────────────────────────────────────────── */

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, children, maxWidth = "max-w-lg" }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden`}
        style={{ boxShadow: "var(--shadow-popover)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <h2 className="text-[16px] font-semibold text-[var(--color-text)]">{title}</h2>
          <Button variant="icon" size="sm" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </Button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

/* ── Kbd ─────────────────────────────────────────────────────────────────── */

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
    {children}
  </kbd>
);

/* ── EmptyState / ErrorState / Skeleton ──────────────────────────────────── */

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && <div className="mb-3 text-[var(--color-text-muted)]">{icon}</div>}
    <h3 className="text-[16px] font-semibold text-[var(--color-text)]">{title}</h3>
    {description && (
      <p className="mt-1.5 max-w-md text-[13px] text-[var(--color-text-muted)]">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ message, onRetry, retryLabel = "Retry" }) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center py-12 px-6 text-center"
  >
    <AlertCircle size={24} strokeWidth={1.75} className="mb-2 text-[var(--color-error)]" />
    <p className="max-w-md text-[14px] text-[var(--color-text)]">{message}</p>
    {onRetry && (
      <Button variant="subtle" size="sm" onClick={onRetry} className="mt-3">
        {retryLabel}
      </Button>
    )}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-[6px] bg-[var(--color-surface-2)] ${className}`}
  />
);

/* ── ToastContainer ──────────────────────────────────────────────────────── */

export const ToastContainer: React.FC = () => {
  const toasts = useSettingsStore((s) => s.toasts);
  const dismiss = useSettingsStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 end-5 z-50 flex flex-col gap-2 max-w-sm"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[13px] text-[var(--color-text)]"
          style={{ boxShadow: "var(--shadow-popover)" }}
        >
          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                t.variant === "error"
                  ? "bg-[var(--color-error)]"
                  : t.variant === "success"
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-primary)]"
              }`}
            />
            {t.message}
          </span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  );
};
