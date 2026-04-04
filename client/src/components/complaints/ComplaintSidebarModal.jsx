import React from "react";

export default function ComplaintSidebarModal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative z-10 h-full w-full max-w-full overflow-hidden bg-white p-4 shadow-xl transition-transform duration-300 ease-out dark:bg-slate-900 md:max-w-md md:w-[480px] md:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2 py-1 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 h-full overflow-y-auto">{children}</div>

        {footer && <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">{footer}</div>}
      </aside>
    </div>
  );
}
