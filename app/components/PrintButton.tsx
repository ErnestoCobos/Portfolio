"use client";

/**
 * Tiny client island for the CV page: triggers the browser print dialog
 * (→ "Save as PDF"). The rest of the CV is a static server component; this
 * is the only piece that needs an event handler. Hidden in print via the
 * `cv-noprint` class so it never lands in the exported PDF.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="cv-noprint cv-print-btn"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
