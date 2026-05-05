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
  const { currentForm, loading, saving, error, success, currentSubmission } = useSelector(
    (state) => state.dynamicForms,
  );
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchDynamicFormAction(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (currentForm) {
      const timer = setTimeout(() => {
        setValues(getInitialSubmissionValues(currentForm));
        setErrors({});
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [currentForm]);

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
    () => getVisibleSections(currentForm || { sections: [] }, values),
    [currentForm, values],
  );

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateDynamicFormValues(currentForm, values);
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
          <h1>{currentForm?.name || "Loading form"}</h1>
          <p>{currentForm?.description || "This form is rendered directly from the stored schema."}</p>
        </div>
      </div>

      <div className="dynamic-form-canvas">
        {loading && !currentForm ? (
          <FormSkeleton rows={6} />
        ) : (
          <form className="dynamic-form" onSubmit={handleSubmit}>
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

            <div className="dynamic-form__actions">
              <button className="btn-outline" type="button" onClick={() => navigate("/forms")}>
                Back to Forms
              </button>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Submitting..." : "Submit Form"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
