import { apiRequest } from "./apiClient";

export function fetchDynamicForms({ token, query } = {}) {
  return apiRequest("/dynamic-forms", { token, query });
}

export function fetchDynamicForm(idOrSlug, token) {
  return apiRequest(`/dynamic-forms/${idOrSlug}`, { token });
}

export function createDynamicForm(payload, token) {
  return apiRequest("/dynamic-forms", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateDynamicForm(id, payload, token) {
  return apiRequest(`/dynamic-forms/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function updateDynamicFormStatus(id, isActive, token) {
  return apiRequest(`/dynamic-forms/${id}/status`, {
    method: "PATCH",
    token,
    body: { isActive },
  });
}

export function deleteDynamicForm(id, token) {
  return apiRequest(`/dynamic-forms/${id}`, {
    method: "DELETE",
    token,
  });
}

export function fetchFormSubmissions({ token, query } = {}) {
  return apiRequest("/dynamic-forms/submissions", { token, query });
}

export function createFormSubmission(slug, payload, token) {
  return apiRequest(`/dynamic-forms/${slug}/submissions`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateFormSubmission(id, payload, token) {
  return apiRequest(`/dynamic-forms/submissions/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}
