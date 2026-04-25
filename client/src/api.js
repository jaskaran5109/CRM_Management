import { getApiBaseUrl } from "./config/apiConfig";

const BASE = getApiBaseUrl();

const getHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
});

export const signup = async (name, email, password) => {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const getAllUsers = async (token) => {
  const res = await fetch(`${BASE}/users`, {
    headers: getHeaders(token),
  });
  return res.json();
};

export const deleteUser = async (id, token) => {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.json();
};

export const changeRole = async (id, role, token) => {
  const res = await fetch(`${BASE}/users/${id}/role`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ role }),
  });
  return res.json();
};

export const updateUser = async ({ id, updates }, token) => {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(updates),
  });
  return res.json();
};
