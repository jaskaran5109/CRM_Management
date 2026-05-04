const LEGACY_STATUS_VALUES = new Set(["pending", "in_progress", "inprogress", "resolved"]);

const normalizeComplaintStatus = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatComplaintStatusLabel = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const isLegacyComplaintStatus = (value = "") =>
  LEGACY_STATUS_VALUES.has(
    String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
  );

export const getComplaintStatusClassName = (value = "") =>
  `status-${normalizeComplaintStatus(value)}`;
