import React from "react";
import {
  formatComplaintStatusLabel,
  isLegacyComplaintStatus,
} from "../../utils/complaintStatus";

const statusStyle = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  workflow: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100",
};

const priorityStyle = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  medium: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const formatDate = (dateString) => new Date(dateString).toLocaleString();

export default function ComplaintDetails({ mode, complaint, formData, onChange, onEdit }) {
  if (!complaint && mode === "view") {
    return <p className="text-sm text-slate-500">No complaint selected.</p>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Basic Info
        </h3>

        {mode === "view" ? (
          <div className="mt-3 space-y-2">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{complaint.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{complaint.category}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(complaint.createdAt)}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="Complaint title"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={onChange}
              placeholder="Category"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Description</h3>
        {mode === "view" ? (
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{complaint.description}</p>
        ) : (
          <textarea
            rows={5}
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Describe the complaint"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Assignment</h3>
        {mode === "view" ? (
          <div className="mt-3 flex items-center gap-3">
            <img className="h-10 w-10 rounded-full object-cover" src={complaint.assignedTo.avatar} alt={complaint.assignedTo.name} />
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">{complaint.assignedTo.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assigned User</p>
            </div>
          </div>
        ) : (
          <input
            type="text"
            name="assignedTo"
            value={formData.assignedTo?.name || ""}
            onChange={onChange}
            placeholder="Assigned user"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Status & Priority</h3>
        {mode === "view" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isLegacyComplaintStatus(complaint.status)
                  ? statusStyle[complaint.status] || statusStyle.pending
                  : statusStyle.workflow
              }`}
            >
              {formatComplaintStatusLabel(complaint.status)}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle[complaint.priority]}`}>
              {complaint.priority}
            </span>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {isLegacyComplaintStatus(formData.status) && (
                <option value={formData.status}>
                  {formatComplaintStatusLabel(formData.status)} (legacy)
                </option>
              )}
            </select>
            <select
              name="priority"
              value={formData.priority}
              onChange={onChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Attachments</h3>
        <div className="mt-2">
          {mode === "view" ? (
            <ul className="space-y-2">
              {complaint.attachments?.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-300">📎</span>
                  <a href={a.url} className="underline hover:text-blue-500" target="_blank" rel="noopener noreferrer">
                    {a.name}
                  </a>
                </li>
              ))}
              {(!complaint.attachments || complaint.attachments.length === 0) && <p className="text-slate-500 dark:text-slate-400">No attachments</p>}
            </ul>
          ) : (
            <input
              type="file"
              name="attachments"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            />
          )}
        </div>
      </section>

      {mode === "view" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
            <h4 className="font-medium text-slate-700 dark:text-slate-200">Timeline</h4>
            <ul className="mt-2 space-y-2">
              {(complaint.history || []).map((event, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-500 dark:bg-slate-300" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{event.type}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{event.detail}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(event.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onEdit}
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Edit Complaint
          </button>
        </>
      )}
    </div>
  );
}
