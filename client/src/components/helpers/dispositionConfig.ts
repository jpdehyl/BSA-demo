/**
 * Disposition configuration for call review
 * Extracted from call-review-dialog.tsx for clarity and reusability
 */

/**
 * Disposition configuration object
 */
export interface DispositionConfig {
  label: string;
  colorClass: string;
}

/**
 * Map of disposition keys to their display configuration
 */
const DISPOSITION_CONFIG: Record<string, DispositionConfig> = {
  "connected": {
    label: "Connected",
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "voicemail": {
    label: "Voicemail",
    colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  "no-answer": {
    label: "No Answer",
    colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
  },
  "busy": {
    label: "Busy",
    colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  "callback-scheduled": {
    label: "Callback Scheduled",
    colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  "not-interested": {
    label: "Not Interested",
    colorClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  "qualified": {
    label: "Qualified",
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  "meeting-booked": {
    label: "Meeting Booked",
    colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

/**
 * Default configuration for unknown dispositions
 */
const DEFAULT_DISPOSITION: DispositionConfig = {
  label: "",
  colorClass: "bg-muted text-muted-foreground",
};

/**
 * Get the full configuration for a disposition
 */
export function getDispositionConfig(disposition: string): DispositionConfig {
  const config = DISPOSITION_CONFIG[disposition];
  if (config) {
    return config;
  }
  return {
    ...DEFAULT_DISPOSITION,
    label: disposition,
  };
}

/**
 * Format a disposition key to its display label
 */
export function formatDisposition(disposition: string): string {
  return getDispositionConfig(disposition).label;
}

/**
 * Get the color class for a disposition
 */
export function getDispositionColor(disposition: string): string {
  return getDispositionConfig(disposition).colorClass;
}
