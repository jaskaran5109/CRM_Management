import React from "react";

const statusStyle = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const priorityStyle = {
  low: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200",
  medium: "bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
  high: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200",
};

export default function ComplaintCard({ complaint, onSelect, onDelete }) {
  return (
    <article
      onClick={() => onSelect(complaint)}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
            {complaint.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{complaint.category}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(complaint.id);
          }}
          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-800"
        >
          Delete
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
        {complaint.description}
      </p>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[complaint.status] || statusStyle.pending}`}>
          {complaint.status.replace("_", " ")}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle[complaint.priority] || priorityStyle.low}`}>
          {complaint.priority}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <img
          src={complaint.assignedTo.avatar}
          alt={complaint.assignedTo.name}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{complaint.assignedTo.name}</p>
          <p className="text-xs">{complaint.createdAt}</p>
        </div>
      </div>
    </article>
  );
}
