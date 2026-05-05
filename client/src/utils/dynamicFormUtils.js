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

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyField(type = "text", order = 0) {
  return {
    id: createId("field"),
    key: "",
    label: "",
    type: FIELD_TYPES.includes(type) ? type : "text",
    placeholder: "",
    helperText: "",
    defaultValue:
      type === "multiselect" ? [] : type === "checkbox" || type === "switch" ? false : "",
    validations: {
      required: false,
      minLength: "",
      maxLength: "",
      regex: "",
      min: "",
      max: "",
    },
    permissions: {
      roles: [],
      canView: true,
      canEdit: true,
    },
    ui: {
      readOnly: false,
      disabled: false,
      hidden: false,
    },
    options: [],
    conditions: [],
    order,
  };
}

export function createEmptySection(order = 0) {
  return {
    id: createId("section"),
    key: "",
    title: "",
    description: "",
    order,
    fields: [],
  };
}

export function getDefaultValueForField(field) {
  if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
    return field.defaultValue;
  }

  if (field.type === "multiselect") return [];
  if (field.type === "checkbox" || field.type === "switch") return false;
  if (field.type === "file") return [];
  return "";
}

export function getInitialSubmissionValues(form) {
  const values = {};

  for (const section of form.sections || []) {
    for (const field of section.fields || []) {
      values[field.key] = getDefaultValueForField(field);
    }
  }

  return values;
}

export function evaluateConditionalRules(rules = [], values = {}) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return true;
  }

  return rules.every((rule) => {
    const currentValue = values[rule.field];

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
        return !(currentValue === undefined || currentValue === null || currentValue === "" || (Array.isArray(currentValue) && currentValue.length === 0));
      case "greaterThan":
        return Number(currentValue) > Number(rule.value);
      case "lessThan":
        return Number(currentValue) < Number(rule.value);
      default:
        return true;
    }
  });
}

export function getVisibleSections(form, values = {}) {
  return (form.sections || [])
    .map((section) => ({
      ...section,
      fields: (section.fields || []).filter(
        (field) => !field.ui?.hidden && evaluateConditionalRules(field.conditions, values),
      ),
    }))
    .filter((section) => section.fields.length > 0);
}

function isEmptyValue(field, value) {
  if (field.type === "checkbox" || field.type === "switch") {
    return value !== true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return value === undefined || value === null || String(value).trim() === "";
}

export function validateFieldValue(field, value) {
  const validations = field.validations || {};

  if (validations.required && isEmptyValue(field, value)) {
    return `${field.label} is required`;
  }

  if (isEmptyValue(field, value)) {
    return null;
  }

  if ((field.type === "email" || field.key.toLowerCase().includes("email")) && !/^\S+@\S+\.\S+$/.test(String(value))) {
    return `${field.label} is invalid`;
  }

  if ((field.type === "phone" || field.key.toLowerCase().includes("phone")) && !/^[0-9]{10}$/.test(String(value))) {
    return `${field.label} is invalid`;
  }

  if (validations.minLength && String(value).length < Number(validations.minLength)) {
    return `${field.label} must be at least ${validations.minLength} characters`;
  }

  if (validations.maxLength && String(value).length > Number(validations.maxLength)) {
    return `${field.label} must be at most ${validations.maxLength} characters`;
  }

  if (validations.regex && !(new RegExp(validations.regex).test(String(value)))) {
    return `${field.label} is invalid`;
  }

  if (validations.min !== "" && validations.min !== null && validations.min !== undefined && Number(value) < Number(validations.min)) {
    return `${field.label} must be at least ${validations.min}`;
  }

  if (validations.max !== "" && validations.max !== null && validations.max !== undefined && Number(value) > Number(validations.max)) {
    return `${field.label} must be at most ${validations.max}`;
  }

  return null;
}

export function validateDynamicFormValues(form, values) {
  const errors = {};
  const sections = getVisibleSections(form, values);

  for (const section of sections) {
    for (const field of section.fields) {
      const error = validateFieldValue(field, values[field.key]);
      if (error) {
        errors[field.key] = error;
      }
    }
  }

  return errors;
}
