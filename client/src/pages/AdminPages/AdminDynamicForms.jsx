import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdAdd, MdDelete, MdEdit, MdKeyboardArrowDown, MdKeyboardArrowUp, MdVisibility } from "react-icons/md";
import { toast } from "react-toastify";

import { TableSkeleton } from "../../components/common/Skeleton";
import { fetchAllUserRoles } from "../../redux/slices/adminSlices/userRoleSlice";
import {
  clearDynamicFormStatus,
  createDynamicFormAction,
  deleteDynamicFormAction,
  fetchDynamicFormsAction,
  fetchFormSubmissionsAction,
  setCurrentDynamicForm,
  toggleDynamicFormStatusAction,
  updateDynamicFormAction,
} from "../../redux/slices/dynamicFormSlice";
import { createEmptyField, createEmptySection } from "../../utils/dynamicFormUtils.js";
import "./Admin.css";
import "../DynamicForms.css";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "select",
  "multiselect",
  "checkbox",
  "radio",
  "switch",
  "date",
  "datetime",
  "file",
];

function buildEditorState(form) {
  if (!form) {
    return {
      name: "",
      slug: "",
      description: "",
      isActive: true,
      workflowConfig: {
        initialStatus: "new",
        allowComments: true,
        allowAssignments: false,
        allowedStatusTransitions: [],
      },
      sections: [createEmptySection(0)],
    };
  }

  return {
    name: form.name || "",
    slug: form.slug || "",
    description: form.description || "",
    isActive: form.isActive !== false,
    workflowConfig: {
      initialStatus: form.workflowConfig?.initialStatus || "new",
      allowComments: form.workflowConfig?.allowComments !== false,
      allowAssignments: Boolean(form.workflowConfig?.allowAssignments),
      allowedStatusTransitions: form.workflowConfig?.allowedStatusTransitions || [],
    },
    sections:
      (form.sections || []).map((section, sectionIndex) => ({
        ...section,
        fields:
          (section.fields || []).map((field, fieldIndex) => ({
            ...createEmptyField(field.type, fieldIndex),
            ...field,
          })) || [],
        order: section.order ?? sectionIndex,
      })) || [createEmptySection(0)],
  };
}

export default function AdminDynamicForms() {
  const dispatch = useDispatch();
  const { forms, submissions, currentForm, loading, saving, error, success } = useSelector(
    (state) => state.dynamicForms,
  );
  const { list: userRoles = [] } = useSelector((state) => state.userRoles);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [editorState, setEditorState] = useState(buildEditorState(null));
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeFieldRef, setActiveFieldRef] = useState({ sectionId: null, fieldId: null });
  const [search, setSearch] = useState("");
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    dispatch(fetchDynamicFormsAction({ includeInactive: true, limit: 50 }));
    dispatch(fetchFormSubmissionsAction({ limit: 20 }));
    dispatch(fetchAllUserRoles());
  }, [dispatch]);

  useEffect(() => {
    if (error && !toast.isActive("dynamic-forms-error")) {
      toast.error(error, { toastId: "dynamic-forms-error" });
      dispatch(clearDynamicFormStatus());
    }

    if (success && !toast.isActive("dynamic-forms-success")) {
      toast.success(success, { toastId: "dynamic-forms-success" });
      dispatch(clearDynamicFormStatus());
    }
  }, [dispatch, error, success]);

  useEffect(() => {
    const form = forms.find((item) => item._id === selectedFormId) || null;
    dispatch(setCurrentDynamicForm(form));
  }, [dispatch, forms, selectedFormId]);

  useEffect(() => {
    const state = buildEditorState(currentForm);
    const timer = setTimeout(() => {
      setEditorState(state);
      setActiveSectionId(state.sections[0]?.id || null);
      setActiveFieldRef({
        sectionId: state.sections[0]?.id || null,
        fieldId: state.sections[0]?.fields?.[0]?.id || null,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [currentForm]);

  const filteredForms = useMemo(() => {
    if (!search.trim()) {
      return forms;
    }

    const query = search.trim().toLowerCase();
    return forms.filter((form) =>
      [form.name, form.slug, form.description].some((value) =>
        String(value || "").toLowerCase().includes(query),
      ),
    );
  }, [forms, search]);

  const selectedSection =
    editorState.sections.find((section) => section.id === activeSectionId) || editorState.sections[0];
  const selectedField =
    selectedSection?.fields.find((field) => field.id === activeFieldRef.fieldId) || selectedSection?.fields[0] || null;
  const selectedUserRoleIds = (selectedField?.permissions?.userRoles || []).map((role) =>
    String(role?._id || role),
  );

  function updateRootField(key, value) {
    setEditorState((prev) => ({ ...prev, [key]: value }));
  }

  function updateWorkflowField(key, value) {
    setEditorState((prev) => ({
      ...prev,
      workflowConfig: {
        ...prev.workflowConfig,
        [key]: value,
      },
    }));
  }

  function updateSection(sectionId, changes) {
    setEditorState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, ...changes } : section,
      ),
    }));
  }

  function addSection() {
    const section = createEmptySection(editorState.sections.length);
    setEditorState((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }));
    setActiveSectionId(section.id);
  }

  function removeSection(sectionId) {
    setEditorState((prev) => {
      const nextSections = prev.sections.filter((section) => section.id !== sectionId);
      return {
        ...prev,
        sections: nextSections.length > 0 ? nextSections : [createEmptySection(0)],
      };
    });
  }

  function moveSection(sectionId, direction) {
    setEditorState((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.sections.length) {
        return prev;
      }
      const sections = [...prev.sections];
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
      return {
        ...prev,
        sections: sections.map((section, order) => ({ ...section, order })),
      };
    });
  }

  function reorderSections(fromId, toId) {
    setEditorState((prev) => {
      const sections = [...prev.sections];
      const fromIndex = sections.findIndex((section) => section.id === fromId);
      const toIndex = sections.findIndex((section) => section.id === toId);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return prev;
      }

      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);

      return {
        ...prev,
        sections: sections.map((section, order) => ({ ...section, order })),
      };
    });
  }

  function addField(sectionId, type = "text") {
    setEditorState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const field = createEmptyField(type, section.fields.length);
        setActiveFieldRef({ sectionId, fieldId: field.id });
        return {
          ...section,
          fields: [...section.fields, field],
        };
      }),
    }));
  }

  function updateField(sectionId, fieldId, changes) {
    setEditorState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          fields: section.fields.map((field) =>
            field.id === fieldId ? { ...field, ...changes } : field,
          ),
        };
      }),
    }));
  }

  function removeField(sectionId, fieldId) {
    setEditorState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          fields: section.fields.filter((field) => field.id !== fieldId),
        };
      }),
    }));
  }

  function moveField(sectionId, fieldId, direction) {
    setEditorState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const index = section.fields.findIndex((field) => field.id === fieldId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= section.fields.length) {
          return section;
        }

        const fields = [...section.fields];
        [fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]];
        return {
          ...section,
          fields: fields.map((field, order) => ({ ...field, order })),
        };
      }),
    }));
  }

  function reorderFields(sectionId, fromFieldId, toFieldId) {
    setEditorState((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const fields = [...section.fields];
        const fromIndex = fields.findIndex((field) => field.id === fromFieldId);
        const toIndex = fields.findIndex((field) => field.id === toFieldId);

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          return section;
        }

        const [moved] = fields.splice(fromIndex, 1);
        fields.splice(toIndex, 0, moved);

        return {
          ...section,
          fields: fields.map((field, order) => ({ ...field, order })),
        };
      }),
    }));
  }

  function toggleFieldUserRole(roleId) {
    if (!selectedField) {
      return;
    }

    const nextRoles = selectedUserRoleIds.includes(roleId)
      ? selectedUserRoleIds.filter((id) => id !== roleId)
      : [...selectedUserRoleIds, roleId];

    updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
      permissions: {
        ...selectedField.permissions,
        userRoles: nextRoles,
      },
    });
  }

  function handleSave() {
    if (!editorState.name.trim()) {
      toast.error("Form name is required");
      return;
    }

    if (!editorState.sections.length) {
      toast.error("At least one section is required");
      return;
    }

    const missingSectionTitle = editorState.sections.find((section) => !section.title.trim());
    if (missingSectionTitle) {
      toast.error("Every section must have a title");
      return;
    }

    const missingFieldLabel = editorState.sections
      .flatMap((section) => section.fields)
      .find((field) => !field.label.trim());
    if (missingFieldLabel) {
      toast.error("Every field must have a label");
      return;
    }

    const payload = {
      ...editorState,
      workflowConfig: {
        ...editorState.workflowConfig,
        allowedStatusTransitions: editorState.workflowConfig.allowedStatusTransitions
          .map((value) => value.trim())
          .filter(Boolean),
      },
    };

    if (selectedFormId) {
      dispatch(updateDynamicFormAction({ id: selectedFormId, payload }));
      return;
    }

    dispatch(createDynamicFormAction(payload)).then((action) => {
      if (action.payload?.data?._id) {
        setSelectedFormId(action.payload.data._id);
      }
    });
  }

  function resetEditor() {
    setSelectedFormId(null);
    dispatch(setCurrentDynamicForm(null));
    setEditorState(buildEditorState(null));
  }

  return (
    <div className="admin-page dynamic-forms-page">
      <div className="dash-header">
        <div>
          <h2>Dynamic Forms</h2>
          <p className="subtitle">Build schema-driven forms and review live submissions.</p>
        </div>
        <div className="action-btns">
          <button className="btn-outline" onClick={resetEditor} type="button">
            New Form
          </button>
          <button className="btn-primary" onClick={handleSave} type="button" disabled={saving}>
            {saving ? "Saving..." : selectedFormId ? "Update Form" : "Create Form"}
          </button>
        </div>
      </div>

      <div className="dynamic-admin-summary">
        <div className="dynamic-admin-summary__card">
          <strong>{forms.length}</strong>
          <span>Configured forms</span>
        </div>
        <div className="dynamic-admin-summary__card">
          <strong>{forms.filter((form) => form.isActive).length}</strong>
          <span>Active forms</span>
        </div>
        <div className="dynamic-admin-summary__card">
          <strong>{submissions.length}</strong>
          <span>Recent submissions</span>
        </div>
      </div>

      <div className="dynamic-admin-grid">
        <aside className="dynamic-admin-panel">
          <div className="dynamic-admin-panel__head">
            <h3>Forms</h3>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search forms"
            />
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={1} />
          ) : (
            <div className="dynamic-admin-list">
              {filteredForms.map((form) => (
                <button
                  key={form._id}
                  className={`dynamic-admin-card ${selectedFormId === form._id ? "is-active" : ""}`}
                  onClick={() => setSelectedFormId(form._id)}
                  type="button"
                >
                  <div>
                    <strong>{form.name}</strong>
                    <p>{form.slug}</p>
                  </div>
                  <span className={`status-badge ${form.isActive ? "active" : "inactive"}`}>
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="dynamic-admin-panel dynamic-admin-builder">
          <div className="dynamic-admin-panel__head">
            <h3>Builder</h3>
            <button className="btn-role" onClick={addSection} type="button">
              <MdAdd /> Add Section
            </button>
          </div>

          <div className="dynamic-builder-form">
            <div className="dynamic-builder-form__grid">
              <div className="form-group">
                <label>Form Name</label>
                <input
                  value={editorState.name}
                  onChange={(event) => updateRootField("name", event.target.value)}
                  placeholder="Service intake form"
                />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input
                  value={editorState.slug}
                  onChange={(event) => updateRootField("slug", event.target.value)}
                  placeholder="service-intake-form"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="dynamic-form__textarea"
                value={editorState.description}
                onChange={(event) => updateRootField("description", event.target.value)}
                rows="3"
                placeholder="What this form is used for"
              />
            </div>

            <div className="dynamic-builder-form__grid">
              <div className="form-group">
                <label>Initial Status</label>
                <input
                  value={editorState.workflowConfig.initialStatus}
                  onChange={(event) => updateWorkflowField("initialStatus", event.target.value)}
                  placeholder="new"
                />
              </div>
              <div className="form-group">
                <label>Allowed Status Transitions</label>
                <input
                  value={editorState.workflowConfig.allowedStatusTransitions.join(", ")}
                  onChange={(event) =>
                    updateWorkflowField(
                      "allowedStatusTransitions",
                      event.target.value.split(",").map((item) => item.trim()),
                    )
                  }
                  placeholder="triage, approved, closed"
                />
              </div>
            </div>

            <div className="actions-top">
              <label className="checkbox-role-item">
                <input
                  type="checkbox"
                  checked={editorState.isActive}
                  onChange={(event) => updateRootField("isActive", event.target.checked)}
                />
                <span>Active form</span>
              </label>
              <label className="checkbox-role-item">
                <input
                  type="checkbox"
                  checked={editorState.workflowConfig.allowComments}
                  onChange={(event) => updateWorkflowField("allowComments", event.target.checked)}
                />
                <span>Comments enabled</span>
              </label>
              <label className="checkbox-role-item">
                <input
                  type="checkbox"
                  checked={editorState.workflowConfig.allowAssignments}
                  onChange={(event) =>
                    updateWorkflowField("allowAssignments", event.target.checked)
                  }
                />
                <span>Assignments enabled</span>
              </label>
            </div>

            <div className="dynamic-sections">
              {editorState.sections.map((section, index) => (
                <div key={section.id} className="dynamic-section-card">
                  <div
                    className="dynamic-section-card__head"
                    draggable
                    onDragStart={() => setDragState({ type: "section", sectionId: section.id })}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragState?.type === "section") {
                        reorderSections(dragState.sectionId, section.id);
                      }
                      setDragState(null);
                    }}
                  >
                    <button
                      className="dynamic-section-card__title"
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      <strong>{section.title || `Section ${index + 1}`}</strong>
                      <span>{section.fields.length} fields</span>
                    </button>
                    <div className="action-btns">
                      <button className="btn-outline" type="button" onClick={() => moveSection(section.id, -1)}>
                        <MdKeyboardArrowUp />
                      </button>
                      <button className="btn-outline" type="button" onClick={() => moveSection(section.id, 1)}>
                        <MdKeyboardArrowDown />
                      </button>
                      <button className="btn-delete" type="button" onClick={() => removeSection(section.id)}>
                        <MdDelete />
                      </button>
                    </div>
                  </div>

                  <div className="dynamic-builder-form__grid">
                    <div className="form-group">
                      <label>Section Title</label>
                      <input
                        value={section.title}
                        onChange={(event) => updateSection(section.id, { title: event.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Section Key</label>
                      <input
                        value={section.key || ""}
                        onChange={(event) => updateSection(section.id, { key: event.target.value })}
                        placeholder="optional-key"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Section Description</label>
                    <input
                      value={section.description || ""}
                      onChange={(event) =>
                        updateSection(section.id, { description: event.target.value })
                      }
                    />
                  </div>

                  <div className="dynamic-section-card__fields">
                    {(section.fields || []).map((field) => (
                      <button
                        key={field.id}
                        className={`dynamic-field-pill ${
                          activeFieldRef.fieldId === field.id ? "is-active" : ""
                        }`}
                        type="button"
                        draggable
                        onDragStart={() =>
                          setDragState({
                            type: "field",
                            sectionId: section.id,
                            fieldId: field.id,
                          })
                        }
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (
                            dragState?.type === "field" &&
                            dragState.sectionId === section.id
                          ) {
                            reorderFields(section.id, dragState.fieldId, field.id);
                          }
                          setDragState(null);
                        }}
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setActiveFieldRef({ sectionId: section.id, fieldId: field.id });
                        }}
                      >
                        <span>{field.label || "Untitled field"}</span>
                        <small>{field.type}</small>
                      </button>
                    ))}
                  </div>

                  <div className="action-btns">
                    {FIELD_TYPES.map((type) => (
                      <button
                        key={type}
                        className="btn-outline"
                        type="button"
                        onClick={() => addField(section.id, type)}
                      >
                        <MdAdd /> {type}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dynamic-admin-panel">
          <div className="dynamic-admin-panel__head">
            <h3>Field Settings</h3>
            {selectedField ? (
              <div className="action-btns">
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => moveField(activeFieldRef.sectionId, activeFieldRef.fieldId, -1)}
                >
                  <MdKeyboardArrowUp />
                </button>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => moveField(activeFieldRef.sectionId, activeFieldRef.fieldId, 1)}
                >
                  <MdKeyboardArrowDown />
                </button>
                <button
                  className="btn-delete"
                  type="button"
                  onClick={() => removeField(activeFieldRef.sectionId, activeFieldRef.fieldId)}
                >
                  <MdDelete />
                </button>
              </div>
            ) : null}
          </div>

          {selectedField ? (
            <div className="dynamic-builder-form">
              <div className="form-group">
                <label>Label</label>
                <input
                  value={selectedField.label}
                  onChange={(event) =>
                    updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                      label: event.target.value,
                    })
                  }
                />
              </div>

              <div className="dynamic-builder-form__grid">
                <div className="form-group">
                  <label>Key</label>
                  <input
                    value={selectedField.key || ""}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        key: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={selectedField.type}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        type: event.target.value,
                      })
                    }
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Placeholder</label>
                <input
                  value={selectedField.placeholder || ""}
                  onChange={(event) =>
                    updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                      placeholder: event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Helper Text</label>
                <input
                  value={selectedField.helperText || ""}
                  onChange={(event) =>
                    updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                      helperText: event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Default Value</label>
                <input
                  value={
                    Array.isArray(selectedField.defaultValue)
                      ? selectedField.defaultValue.join(", ")
                      : selectedField.defaultValue ?? ""
                  }
                  onChange={(event) =>
                    updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                      defaultValue:
                        selectedField.type === "multiselect"
                          ? event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean)
                          : selectedField.type === "checkbox" || selectedField.type === "switch"
                            ? event.target.value === "true"
                            : event.target.value,
                    })
                  }
                  placeholder="Optional default value"
                />
              </div>

              {["select", "multiselect", "radio"].includes(selectedField.type) ? (
                <div className="form-group">
                  <label>Options</label>
                  <textarea
                    className="dynamic-form__textarea"
                    rows="4"
                    value={(selectedField.options || [])
                      .map((option) => `${option.label}:${option.value}`)
                      .join("\n")}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        options: event.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [label, value] = line.split(":");
                            return {
                              label: (label || value || "").trim(),
                              value: (value || label || "").trim(),
                            };
                          }),
                      })
                    }
                    placeholder={"High:high\nLow:low"}
                  />
                </div>
              ) : null}

              <div className="dynamic-builder-form__grid">
                <div className="form-group">
                  <label>Required</label>
                  <label className="checkbox-role-item">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedField.validations?.required)}
                      onChange={(event) =>
                        updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                          validations: {
                            ...selectedField.validations,
                            required: event.target.checked,
                          },
                        })
                      }
                    />
                    <span>Make this field mandatory</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Visible User Roles</label>
                  <div className="dynamic-role-checkboxes">
                    {userRoles.map((role) => {
                      const isChecked = selectedUserRoleIds.includes(role._id);
                      return (
                        <label
                          key={role._id}
                          className={`dynamic-role-checkbox ${isChecked ? "is-active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFieldUserRole(role._id)}
                          />
                          <span>{role.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedUserRoleIds.length === 0 ? (
                    <p className="dynamic-form__helper">
                      No user roles selected. The field stays visible for all logged-in users.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="dynamic-builder-form__grid">
                <div className="form-group">
                  <label>View Permission</label>
                  <label className="checkbox-role-item">
                    <input
                      type="checkbox"
                      checked={selectedField.permissions?.canView !== false}
                      onChange={(event) =>
                        updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                          permissions: {
                            ...selectedField.permissions,
                            canView: event.target.checked,
                          },
                        })
                      }
                    />
                    <span>Visible to permitted users</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Edit Permission</label>
                  <label className="checkbox-role-item">
                    <input
                      type="checkbox"
                      checked={selectedField.permissions?.canEdit !== false}
                      onChange={(event) =>
                        updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                          permissions: {
                            ...selectedField.permissions,
                            canEdit: event.target.checked,
                          },
                        })
                      }
                    />
                    <span>Editable to permitted users</span>
                  </label>
                </div>
              </div>

              <div className="dynamic-builder-form__grid">
                <div className="form-group">
                  <label>Min Length</label>
                  <input
                    value={selectedField.validations?.minLength ?? ""}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        validations: {
                          ...selectedField.validations,
                          minLength: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Max Length</label>
                  <input
                    value={selectedField.validations?.maxLength ?? ""}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        validations: {
                          ...selectedField.validations,
                          maxLength: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="dynamic-builder-form__grid">
                <div className="form-group">
                  <label>Regex</label>
                  <input
                    value={selectedField.validations?.regex ?? ""}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        validations: {
                          ...selectedField.validations,
                          regex: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Min / Max</label>
                  <div className="dynamic-builder-form__grid">
                    <input
                      value={selectedField.validations?.min ?? ""}
                      onChange={(event) =>
                        updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                          validations: {
                            ...selectedField.validations,
                            min: event.target.value,
                          },
                        })
                      }
                      placeholder="Min"
                    />
                    <input
                      value={selectedField.validations?.max ?? ""}
                      onChange={(event) =>
                        updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                          validations: {
                            ...selectedField.validations,
                            max: event.target.value,
                          },
                        })
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="dynamic-builder-form__grid">
                <div className="form-group">
                  <label>Conditional Visibility</label>
                  <textarea
                    className="dynamic-form__textarea"
                    rows="4"
                    value={(selectedField.conditions || [])
                      .map((rule) => `${rule.field}|${rule.operator}|${rule.value ?? ""}`)
                      .join("\n")}
                    onChange={(event) =>
                      updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                        conditions: event.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [field, operator, value] = line.split("|");
                            return { field, operator, value };
                          }),
                      })
                    }
                    placeholder={"issueType|equals|billing"}
                  />
                </div>
                <div className="form-group">
                  <label>Field State</label>
                  <div className="checkbox-role-list">
                    {["readOnly", "disabled", "hidden"].map((key) => (
                      <label key={key} className="checkbox-role-item">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedField.ui?.[key])}
                          onChange={(event) =>
                            updateField(activeFieldRef.sectionId, activeFieldRef.fieldId, {
                              ui: {
                                ...selectedField.ui,
                                [key]: event.target.checked,
                              },
                            })
                          }
                        />
                        <span>{key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="subtitle">Select or create a field to configure its settings.</p>
          )}
        </section>
      </div>

      <div className="table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Form</th>
              <th>Status</th>
              <th>Sections</th>
              <th>Fields</th>
              <th>Submissions</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.length > 0 ? (
              forms.map((form) => {
                const formSubmissionCount = submissions.filter(
                  (submission) => submission.formSlug === form.slug,
                ).length;

                return (
                  <tr key={form._id}>
                    <td>
                      <strong>{form.name}</strong>
                      <div className="subtitle">{form.slug}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${form.isActive ? "active" : "inactive"}`}>
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{form.sections?.length || 0}</td>
                    <td>{(form.sections || []).reduce((sum, section) => sum + (section.fields?.length || 0), 0)}</td>
                    <td>{formSubmissionCount}</td>
                    <td className="text-right">
                      <div className="action-btns" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-outline" type="button" onClick={() => setSelectedFormId(form._id)}>
                          <MdEdit />
                        </button>
                        <button
                          className="btn-outline"
                          type="button"
                          onClick={() =>
                            dispatch(toggleDynamicFormStatusAction({ id: form._id, isActive: !form.isActive }))
                          }
                        >
                          <MdVisibility />
                        </button>
                        <button
                          className="btn-delete"
                          type="button"
                          onClick={() => dispatch(deleteDynamicFormAction(form._id))}
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No dynamic forms found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
