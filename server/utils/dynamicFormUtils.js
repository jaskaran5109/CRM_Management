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

const RULE_OPERATORS = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "includes",
  "notIncludes",
  "isEmpty",
  "isNotEmpty",
  "greaterThan",
  "lessThan",
];

export function slugifyFormName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toCamelCase(value = "") {
  const cleaned = String(value)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (cleaned.length === 0) {
    return "";
  }

  return cleaned
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

export function normalizeConditionalRule(rule = {}) {
  const operator = RULE_OPERATORS.includes(rule.operator)
    ? rule.operator
    : "equals";

  return {
    field: String(rule.field || "").trim(),
    operator,
    value: rule.value ?? null,
  };
}

export function normalizeField(field = {}, fieldOrder = 0) {
  const label = String(field.label || "").trim();
  const key = String(field.key || "").trim() || toCamelCase(label);
  const type = FIELD_TYPES.includes(field.type) ? field.type : "text";
  const options = Array.isArray(field.options)
    ? field.options
        .map((option) => ({
          label: String(option?.label || option?.value || "").trim(),
          value: String(option?.value || option?.label || "").trim(),
        }))
        .filter((option) => option.label && option.value)
    : [];

  return {
    id: String(field.id || key || `field-${fieldOrder + 1}`),
    key,
    label,
    type,
    placeholder: String(field.placeholder || "").trim(),
    helperText: String(field.helperText || "").trim(),
    defaultValue: field.defaultValue ?? getEmptyValueForType(type),
    validations: {
      required: Boolean(field.validations?.required),
      minLength:
        field.validations?.minLength !== undefined &&
        field.validations?.minLength !== null &&
        field.validations?.minLength !== ""
          ? Number(field.validations.minLength)
          : null,
      maxLength:
        field.validations?.maxLength !== undefined &&
        field.validations?.maxLength !== null &&
        field.validations?.maxLength !== ""
          ? Number(field.validations.maxLength)
          : null,
      regex: String(field.validations?.regex || "").trim(),
      min:
        field.validations?.min !== undefined &&
        field.validations?.min !== null &&
        field.validations?.min !== ""
          ? Number(field.validations.min)
          : null,
      max:
        field.validations?.max !== undefined &&
        field.validations?.max !== null &&
        field.validations?.max !== ""
          ? Number(field.validations.max)
          : null,
    },
    permissions: {
      userRoles: Array.isArray(field.permissions?.userRoles)
        ? [
            ...new Set(
              field.permissions.userRoles
                .map((role) => String(role).trim())
                .filter(Boolean),
            ),
          ]
        : Array.isArray(field.permissions?.roles)
          ? [
              ...new Set(
                field.permissions.roles
                  .map((role) => String(role).trim())
                  .filter(Boolean),
              ),
            ]
        : [],
      canView: field.permissions?.canView !== false,
      canEdit: field.permissions?.canEdit !== false,
    },
    ui: {
      readOnly: Boolean(field.ui?.readOnly),
      disabled: Boolean(field.ui?.disabled),
      hidden: Boolean(field.ui?.hidden),
    },
    options,
    conditions: Array.isArray(field.conditions)
      ? field.conditions.map(normalizeConditionalRule).filter((rule) => rule.field)
      : [],
    order:
      field.order !== undefined && field.order !== null ? Number(field.order) : fieldOrder,
  };
}

export function normalizeSection(section = {}, sectionOrder = 0) {
  const title = String(section.title || "").trim();
  const key = String(section.key || "").trim() || slugifyFormName(title);
  const fields = Array.isArray(section.fields)
    ? section.fields
        .map((field, index) => normalizeField(field, index))
        .sort((a, b) => a.order - b.order)
        .map((field, index) => ({ ...field, order: index }))
    : [];

  return {
    id: String(section.id || key || `section-${sectionOrder + 1}`),
    key,
    title,
    description: String(section.description || "").trim(),
    order:
      section.order !== undefined && section.order !== null
        ? Number(section.order)
        : sectionOrder,
    fields,
  };
}

export function normalizeDynamicFormPayload(payload = {}, existingForm = null) {
  const name = String(payload.name || "").trim();
  const sections = Array.isArray(payload.sections)
    ? payload.sections
        .map((section, index) => normalizeSection(section, index))
        .sort((a, b) => a.order - b.order)
        .map((section, index) => ({ ...section, order: index }))
    : [];

  return {
    name,
    slug: String(payload.slug || "").trim() || slugifyFormName(name || existingForm?.name || ""),
    description: String(payload.description || "").trim(),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    sections,
    workflowConfig: {
      initialStatus: String(payload.workflowConfig?.initialStatus || "new").trim().toLowerCase(),
      allowComments: payload.workflowConfig?.allowComments !== false,
      allowAssignments: Boolean(payload.workflowConfig?.allowAssignments),
      allowedStatusTransitions: Array.isArray(payload.workflowConfig?.allowedStatusTransitions)
        ? payload.workflowConfig.allowedStatusTransitions
            .map((value) => String(value || "").trim().toLowerCase())
            .filter(Boolean)
        : [],
    },
  };
}

export function buildFieldMap(form = {}) {
  const fieldMap = {};
  for (const section of form.sections || []) {
    for (const field of section.fields || []) {
      fieldMap[field.key] = field;
    }
  }
  return fieldMap;
}

export function getEmptyValueForType(type) {
  if (type === "multiselect") return [];
  if (type === "checkbox" || type === "switch") return false;
  if (type === "file") return [];
  return "";
}

function compareValue(rule, currentValue) {
  switch (rule.operator) {
    case "equals":
      return currentValue === rule.value;
    case "notEquals":
      return currentValue !== rule.value;
    case "in":
      return Array.isArray(rule.value) ? rule.value.includes(currentValue) : false;
    case "notIn":
      return Array.isArray(rule.value) ? !rule.value.includes(currentValue) : true;
    case "includes":
      return Array.isArray(currentValue)
        ? currentValue.includes(rule.value)
        : String(currentValue || "").includes(String(rule.value || ""));
    case "notIncludes":
      return Array.isArray(currentValue)
        ? !currentValue.includes(rule.value)
        : !String(currentValue || "").includes(String(rule.value || ""));
    case "isEmpty":
      return currentValue === undefined || currentValue === null || currentValue === "" || (Array.isArray(currentValue) && currentValue.length === 0);
    case "isNotEmpty":
      return !compareValue({ operator: "isEmpty" }, currentValue);
    case "greaterThan":
      return Number(currentValue) > Number(rule.value);
    case "lessThan":
      return Number(currentValue) < Number(rule.value);
    default:
      return true;
  }
}

export function evaluateConditionalRules(rules = [], values = {}) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return true;
  }

  return rules.every((rule) => compareValue(rule, values[rule.field]));
}

export function getVisibleSections(form = {}, values = {}) {
  return (form.sections || [])
    .map((section) => ({
      ...section,
      fields: (section.fields || []).filter(
        (field) => !field.ui?.hidden && evaluateConditionalRules(field.conditions, values),
      ),
    }))
    .filter((section) => section.fields.length > 0);
}

function isEmptyValue(value, type) {
  if (type === "checkbox" || type === "switch") {
    return value !== true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null || String(value).trim() === "";
}

export function validateFieldValue(field, value) {
  const validations = field.validations || {};

  if (validations.required && isEmptyValue(value, field.type)) {
    return `${field.label} is required`;
  }

  if (isEmptyValue(value, field.type)) {
    return null;
  }

  if ((field.type === "email" || field.key.toLowerCase().includes("email")) && !/^\S+@\S+\.\S+$/.test(String(value))) {
    return `${field.label} is invalid`;
  }

  if ((field.type === "phone" || field.key.toLowerCase().includes("phone")) && !/^[0-9]{10}$/.test(String(value))) {
    return `${field.label} is invalid`;
  }

  if (validations.minLength !== null && String(value).length < validations.minLength) {
    return `${field.label} must be at least ${validations.minLength} characters`;
  }

  if (validations.maxLength !== null && String(value).length > validations.maxLength) {
    return `${field.label} must be at most ${validations.maxLength} characters`;
  }

  if (validations.regex) {
    const regex = new RegExp(validations.regex);
    if (!regex.test(String(value))) {
      return `${field.label} is invalid`;
    }
  }

  if (validations.min !== null && Number(value) < validations.min) {
    return `${field.label} must be at least ${validations.min}`;
  }

  if (validations.max !== null && Number(value) > validations.max) {
    return `${field.label} must be at most ${validations.max}`;
  }

  return null;
}

export function validateSubmissionData(form, fieldMap, values = {}) {
  const visibleSections = getVisibleSections(form, values);
  const errors = {};

  for (const section of visibleSections) {
    for (const field of section.fields) {
      const sourceField = fieldMap[field.key] || field;
      const error = validateFieldValue(sourceField, values[field.key]);
      if (error) {
        errors[field.key] = error;
      }
    }
  }

  return errors;
}
