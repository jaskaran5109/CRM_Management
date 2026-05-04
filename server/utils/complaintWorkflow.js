const LEGACY_STATUS_VALUES = new Set(["pending", "in_progress", "inprogress", "resolved"]);
const ACTIVE_ROLE_STATUS_KEY = "active";

export const normalizeStatusValue = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const formatStatusLabel = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const isLegacyStatusValue = (value = "") =>
  LEGACY_STATUS_VALUES.has(normalizeStatusValue(value));

const buildStatusOption = (roleStatus) => ({
  statusId: String(roleStatus?._id || ""),
  value: normalizeStatusValue(roleStatus?.name || ""),
  label: roleStatus?.name || formatStatusLabel(roleStatus?.name || ""),
});

export const getAllowedStatusOptions = ({
  userRoleIds = [],
  roleStatuses = [],
}) => {
  const userRoleSet = new Set(userRoleIds.map(String));
  const byKey = new Map();

  for (const roleStatus of roleStatuses) {
    const roleId = String(roleStatus?.userRole?._id || roleStatus?.userRole || "");
    if (!userRoleSet.has(roleId)) continue;
    const statusFlag = normalizeStatusValue(roleStatus?.status?.name || "");
    if (statusFlag && statusFlag !== ACTIVE_ROLE_STATUS_KEY) continue;

    const option = buildStatusOption(roleStatus);
    if (!option.value || byKey.has(option.value)) continue;
    byKey.set(option.value, option);
  }

  return [...byKey.values()];
};

export const getPublicInitialStatusOption = ({
  tellyCallingRoleId,
  roleStatuses = [],
}) =>
  getAllowedStatusOptions({
    userRoleIds: tellyCallingRoleId ? [tellyCallingRoleId] : [],
    roleStatuses,
  })[0] || null;
