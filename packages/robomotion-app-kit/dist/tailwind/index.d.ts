import { Config } from 'tailwindcss';

/** The semantic colour names an app screen may use. Exported so the
 * reference's Design language section and check-preset-free.ts read one list. */
declare const SEMANTIC_COLORS: readonly ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "muted", "muted-foreground", "border", "input", "ring", "primary", "primary-foreground", "secondary", "secondary-foreground", "destructive", "destructive-foreground", "success", "success-foreground", "warning", "warning-foreground", "info", "info-foreground", "sidebar", "sidebar-foreground", "sidebar-border", "sidebar-accent", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "accent-50", "accent-100", "accent-200", "accent-300", "accent-400", "accent-500", "accent-600", "accent-700", "accent-800", "accent-900", "accent-950"];
declare const appKitPreset: Partial<Config>;

export { SEMANTIC_COLORS, appKitPreset, appKitPreset as default };
