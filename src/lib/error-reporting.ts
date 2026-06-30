type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type ErrorReportingEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: ErrorReportOptions,
  ) => void;
};

declare global {
  interface Window {
    // Optional hook: wire this up to your own error monitoring provider
    // (e.g. Sentry) if you want client-side errors reported somewhere.
    __errorReportingEvents?: ErrorReportingEvents;
  }
}

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  if (window.__errorReportingEvents?.captureException) {
    window.__errorReportingEvents.captureException(
      error,
      {
        source: "react_error_boundary",
        route: window.location.pathname,
        ...context,
      },
      {
        mechanism: "react_error_boundary",
        handled: false,
        severity: "error",
      },
    );
    return;
  }

  console.error(error, context);
}
