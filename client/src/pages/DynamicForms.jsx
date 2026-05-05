import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  clearDynamicFormStatus,
  fetchDynamicFormsAction,
  fetchFormSubmissionsAction,
} from "../redux/slices/dynamicFormSlice";
import { CardSkeleton } from "../components/common/Skeleton";
import "./DynamicForms.css";

export default function DynamicForms() {
  const dispatch = useDispatch();
  const { forms, submissions, loading, error, success } = useSelector((state) => state.dynamicForms);

  useEffect(() => {
    dispatch(fetchDynamicFormsAction({ limit: 50 }));
    dispatch(fetchFormSubmissionsAction({ limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("dynamic-forms-page-error")) {
      toast.error(error, { toastId: "dynamic-forms-page-error" });
      dispatch(clearDynamicFormStatus());
    }
    if (success && !toast.isActive("dynamic-forms-page-success")) {
      toast.success(success, { toastId: "dynamic-forms-page-success" });
      dispatch(clearDynamicFormStatus());
    }
  }, [dispatch, error, success]);

  return (
    <div className="dynamic-forms-screen">
      <div className="dynamic-forms-hero">
        <div>
          <p className="dynamic-forms-hero__eyebrow">Schema-driven workspace</p>
          <h1>Dynamic Forms</h1>
          <p>
            Browse active forms, submit records dynamically, and keep the workflow flexible
            without hardcoding new screens.
          </p>
        </div>
      </div>

      <div className="dynamic-forms-layout">
        <section className="dynamic-forms-catalog">
          <div className="dynamic-forms-layout__head">
            <h2>Available Forms</h2>
            <span>{forms.length} active forms</span>
          </div>

          {loading ? (
            <CardSkeleton count={3} />
          ) : (
            <div className="dynamic-forms-card-grid">
              {forms.map((form) => (
                <article key={form._id} className="dynamic-forms-card">
                  <div className="dynamic-forms-card__meta">
                    <span className="status-badge active">Active</span>
                    <span>{form.sections?.length || 0} sections</span>
                  </div>
                  <h3>{form.name}</h3>
                  <p>{form.description || "No description provided."}</p>
                  <div className="dynamic-forms-card__footer">
                    <span>{(form.sections || []).reduce((sum, section) => sum + (section.fields?.length || 0), 0)} fields</span>
                    <Link className="btn-primary dynamic-forms-card__cta" to={`/forms/${form.slug}`}>
                      Open Form
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="dynamic-forms-submissions">
          <div className="dynamic-forms-layout__head">
            <h2>Recent Submissions</h2>
            <span>{submissions.length} records</span>
          </div>

          <div className="dynamic-forms-submission-list">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <div key={submission._id} className="dynamic-forms-submission-card">
                  <strong>{submission.formId?.name || submission.formSlug}</strong>
                  <p>Status: {submission.status}</p>
                  <span>
                    {new Date(submission.createdAt).toLocaleDateString()} by{" "}
                    {submission.submittedBy?.name || "Unknown"}
                  </span>
                </div>
              ))
            ) : (
              <p className="subtitle">No submissions available yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
