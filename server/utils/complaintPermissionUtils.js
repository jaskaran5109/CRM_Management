import RoleStatus from "../models/RoleStatus.js";
import UserRole from "../models/UserRole.js";
import {
  formatStatusLabel,
  getAllowedStatusOptions,
  getPublicInitialStatusOption,
  isLegacyStatusValue,
  normalizeStatusValue,
} from "./complaintWorkflow.js";

export const getUserRoleIds = (user) =>
  (user?.userRole || [])
    .map((role) => (typeof role === "string" ? role : String(role?._id || role)))
    .filter(Boolean);

const getEntityId = (value) =>
  typeof value === "string" ? value : String(value?._id || value || "");

const getWorkflowCatalog = async () => {
  const roleStatuses = await RoleStatus.find()
    .populate("userRole", "name")
    .populate("nextRoles", "name")
    .populate("status", "name")
    .lean();

  return { roleStatuses };
};

export async function buildComplaintPermissionSnapshot(statusValue) {
  const statusKey = normalizeStatusValue(statusValue);

  if (!statusKey) {
    return {
      statusKey: "",
      statusId: null,
      statusName: "",
      permissions: [],
      allowedUserRoleIds: [],
      nextRoleIds: [],
      generatedAt: new Date(),
    };
  }

  const { roleStatuses } = await getWorkflowCatalog();
  const matchedRoleStatuses = roleStatuses.filter(
    (item) => normalizeStatusValue(item?.name) === statusKey,
  );

  if (matchedRoleStatuses.length === 0) {
    return {
      statusKey,
      statusId: null,
      statusName: formatStatusLabel(statusValue),
      permissions: [],
      allowedUserRoleIds: [],
      nextRoleIds: [],
      generatedAt: new Date(),
    };
  }

  const permissions = matchedRoleStatuses.map((item) => ({
    roleStatusId: String(item._id),
    permissionName: item.name,
    userRoleId: item.userRole?._id ? String(item.userRole._id) : null,
    userRoleName: item.userRole?.name || "",
    nextRoles: (item.nextRoles || []).map((role) => ({
      roleId: role?._id ? String(role._id) : String(role),
      roleName: role?.name || "",
    })),
  }));

  return {
    statusKey,
    statusId: String(matchedRoleStatuses[0]._id),
    statusName: matchedRoleStatuses[0].name,
    permissions,
    allowedUserRoleIds: [
      ...new Set(permissions.map((item) => item.userRoleId).filter(Boolean)),
    ],
    nextRoleIds: [
      ...new Set(
        permissions.flatMap((item) => item.nextRoles.map((role) => role.roleId)),
      ),
    ],
    generatedAt: new Date(),
  };
}

export async function getAllowedStatusOptionsForUser(user) {
  const userRoleIds = getUserRoleIds(user);
  if (userRoleIds.length === 0) {
    return [];
  }

  const { roleStatuses } = await getWorkflowCatalog();
  return getAllowedStatusOptions({
    userRoleIds,
    roleStatuses,
  });
}

export async function validateStatusForUser(user, statusValue) {
  if (!String(statusValue || "").trim()) {
    return {
      ok: false,
      message: "Status is required",
      allowedStatuses: [],
    };
  }

  if (isLegacyStatusValue(statusValue)) {
    return {
      ok: false,
      message: "Legacy complaint statuses are no longer allowed for new updates",
      allowedStatuses: await getAllowedStatusOptionsForUser(user),
    };
  }

  const allowedStatuses = await getAllowedStatusOptionsForUser(user);
  const matched = allowedStatuses.find(
    (option) => normalizeStatusValue(option.value) === normalizeStatusValue(statusValue),
  );

  if (!matched) {
    return {
      ok: false,
      message: "Selected status is not allowed for your role",
      allowedStatuses,
    };
  }

  return {
    ok: true,
    statusValue: matched.value,
    allowedStatuses,
  };
}

export async function resolvePublicInitialStatus() {
  const tellyCallingRoleId = await findTellyCallingRoleId();

  if (!tellyCallingRoleId) {
    return {
      ok: false,
      message: "Telly calling role must exist before creating complaints",
      statusOption: null,
    };
  }

  const { roleStatuses } = await getWorkflowCatalog();
  const statusOption = getPublicInitialStatusOption({
    tellyCallingRoleId,
    roleStatuses,
  });

  if (!statusOption) {
    return {
      ok: false,
      message: "No entry complaint status is configured for Telly Calling",
      statusOption: null,
    };
  }

  return {
    ok: true,
    statusOption,
  };
}

export async function findTellyCallingRoleId() {
  const tellyCallingRole = await UserRole.findOne({
    name: { $regex: /^telly[\s_-]*calling$/i },
  })
    .select("_id")
    .lean();

  return tellyCallingRole?._id ? String(tellyCallingRole._id) : null;
}

export function hasComplaintAccess(complaint, user) {
  if (!user) return false;
  if (user.role === "admin") return true;

  const userRoleIds = getUserRoleIds(user);
  const permissionSnapshot = complaint?.permissionSnapshot || {};
  const allowedRoleIds = (permissionSnapshot.allowedUserRoleIds || []).map(String);
  const nextRoleIds = (complaint?.nextRoles || []).map((role) =>
    typeof role === "string" ? role : String(role?._id || role),
  );
  const isCreator =
    complaint?.createdBy && getEntityId(complaint.createdBy) === String(user._id);
  const isAssigned =
    complaint?.assignedTo && getEntityId(complaint.assignedTo) === String(user._id);

  return (
    isCreator ||
    isAssigned ||
    allowedRoleIds.some((roleId) => userRoleIds.includes(roleId)) ||
    nextRoleIds.some((roleId) => userRoleIds.includes(roleId))
  );
}

export function attachComplaintViewerAccess(complaint, user) {
  const userRoleIds = getUserRoleIds(user);
  const permissionSnapshot = complaint?.permissionSnapshot || {};
  const permissions = permissionSnapshot.permissions || [];

  const matchedPermissions = permissions.filter((item) =>
    userRoleIds.includes(item.userRoleId),
  );
  const nextPermissions = permissions.filter((item) =>
    item.nextRoles?.some((role) => userRoleIds.includes(role.roleId)),
  );

  return {
    userRoleIds,
    matchedPermissionNames: matchedPermissions.map((item) => item.permissionName),
    nextStepPermissionNames: nextPermissions.map((item) => item.permissionName),
    canEdit:
      user?.role === "admin" ||
      matchedPermissions.length > 0 ||
      nextPermissions.length > 0 ||
      getEntityId(complaint?.createdBy) === String(user?._id || "") ||
      getEntityId(complaint?.assignedTo) === String(user?._id || ""),
  };
}
