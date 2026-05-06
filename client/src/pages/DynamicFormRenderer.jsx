import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import SectionRenderer from "../components/dynamicForms/SectionRenderer";
import {
  clearDynamicFormStatus,
  createFormSubmissionAction,
  fetchDynamicFormAction,
} from "../redux/slices/dynamicFormSlice";
import {
  filterDynamicFormForUser,
  getInitialSubmissionValues,
  getVisibleSections,
  validateDynamicFormValues,
} from "../utils/dynamicFormUtils.js";
import { FormSkeleton } from "../components/common/Skeleton";
import "./DynamicForms.css";

export default function DynamicFormRenderer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { currentForm, loading, saving, error, success, currentSubmission } = useSelector(
    (state) => state.dynamicForms,
  );
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchDynamicFormAction(slug));
  }, [dispatch, slug]);

  const roleAwareForm = useMemo(
    () => filterDynamicFormForUser(currentForm || { sections: [] }, user),
    [currentForm, user],
  );

  useEffect(() => {
    if (roleAwareForm?.sections?.length || currentForm) {
      const timer = setTimeout(() => {
        setValues(getInitialSubmissionValues(roleAwareForm));
        setErrors({});
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [currentForm, roleAwareForm]);

  useEffect(() => {
    if (error && !toast.isActive("dynamic-form-render-error")) {
      toast.error(error, { toastId: "dynamic-form-render-error" });
      dispatch(clearDynamicFormStatus());
    }

    if (success && !toast.isActive("dynamic-form-render-success")) {
      toast.success(success, { toastId: "dynamic-form-render-success" });
      dispatch(clearDynamicFormStatus());
    }
  }, [dispatch, error, success]);

  useEffect(() => {
    if (currentSubmission?._id) {
      navigate("/forms");
    }
  }, [currentSubmission, navigate]);

  const visibleSections = useMemo(
    () => getVisibleSections(roleAwareForm || { sections: [] }, values),
    [roleAwareForm, values],
  );

  const totalVisibleFields = visibleSections.reduce(
    (count, section) => count + (section.fields?.length || 0),
    0,
  );
  const currentUserRoleNames = Array.isArray(user?.userRole)
    ? user.userRole.map((role) => role?.name || role).filter(Boolean)
    : [];

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateDynamicFormValues(roleAwareForm, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted validation errors");
      return;
    }

    dispatch(createFormSubmissionAction({ slug, payload: { data: values } }));
  }

  return (
    <div className="dynamic-form-render-screen">
      <div className="dynamic-forms-hero">
        <div>
          <p className="dynamic-forms-hero__eyebrow">Dynamic renderer</p>
          <h1>{roleAwareForm?.name || "Loading form"}</h1>
          <p>
            {roleAwareForm?.description ||
              "This form is rendered directly from the stored schema and filtered by the logged-in user's assigned roles."}
          </p>
        </div>
      </div>

      <div className="dynamic-form-record-layout">
        <aside className="dynamic-form-record-sidebar">
          <div className="dynamic-form-record-card">
            <h3>Entry Summary</h3>
            <div className="dynamic-form-record-stats">
              <div>
                <strong>{visibleSections.length}</strong>
                <span>Visible sections</span>
              </div>
              <div>
                <strong>{totalVisibleFields}</strong>
                <span>Visible fields</span>
              </div>
            </div>
          </div>

          <div className="dynamic-form-record-card">
            <h3>Logged In User Roles</h3>
            {currentUserRoleNames.length > 0 ? (
              <div className="dynamic-form-role-badges">
                {currentUserRoleNames.map((role) => (
                  <span key={role} className="name-chip">
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="dynamic-form-record-note">
                No user roles are assigned to this account. Only unrestricted fields are visible.
              </p>
            )}
          </div>

          <div className="dynamic-form-record-card">
            <h3>Tips</h3>
            <ul className="dynamic-form-record-list">
              <li>Fields hidden by role rules are automatically excluded from submission.</li>
              <li>Read-only fields are visible but cannot be changed.</li>
              <li>Conditional fields appear only when their trigger values match.</li>
            </ul>
          </div>
        </aside>

        <div className="dynamic-form-canvas">
        {loading && !currentForm ? (
          <FormSkeleton rows={6} />
        ) : (
          <form className="dynamic-form" onSubmit={handleSubmit}>
            {totalVisibleFields === 0 ? (
              <div className="dynamic-form__empty-state">
                <h3>No fields available</h3>
                <p>
                  This form does not expose any fields for your assigned user roles.
                </p>
              </div>
            ) : null}

            {visibleSections.map((section) => (
              <SectionRenderer
                key={section.id || section.key}
                section={section}
                values={values}
                errors={errors}
                onChange={handleChange}
                disabled={saving}
              />
            ))}

            <div className="dynamic-form__actions dynamic-form__actions--sticky">
              <button className="btn-outline" type="button" onClick={() => navigate("/forms")}>
                Back to Forms
              </button>
              <button className="btn-primary" type="submit" disabled={saving || totalVisibleFields === 0}>
                {saving ? "Submitting..." : "Submit Form"}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
