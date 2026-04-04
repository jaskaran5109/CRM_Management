import React from "react";
import ComplaintCard from "./ComplaintCard";

export default function ComplaintList({ complaints, loading, error, onSelect, onDelete }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-900 dark:text-red-200">
        <h3 className="text-lg font-semibold">Unable to load complaints</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <h3 className="text-xl font-bold">No complaints yet</h3>
        <p className="mt-2 text-sm">Create a complaint to get started.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {complaints.map((complaint) => (
        <ComplaintCard key={complaint.id} complaint={complaint} onSelect={onSelect} onDelete={onDelete} />
      ))}
    </div>
  );
}