import RoleStatus from "../models/RoleStatus.js";
import Status from "../models/Status.js";
import UserRole from "../models/UserRole.js";

const normalizeStatusKey = (value = "") =>
  String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");

export async function buildComplaintPermissionSnapshot(statusValue) {
  const statusKey = normalizeStatusKey(statusValue);

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

  const statuses = await Status.find().select("_id name").lean();
  const matchedStatus = statuses.find(
    (item) => normalizeStatusKey(item.name) === statusKey,
  );

  if (!matchedStatus) {
    return {
      statusKey,
      statusId: null,
      statusName: "",
      permissions: [],
      allowedUserRoleIds: [],
      nextRoleIds: [],
      generatedAt: new Date(),
    };
  }

  const roleStatuses = await RoleStatus.find({ status: matchedStatus._id })
    .populate("userRole", "name")
    .populate("nextRoles", "name")
    .lean();

  const permissions = roleStatuses.map((item) => ({
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
    statusId: String(matchedStatus._id),
    statusName: matchedStatus.name,
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

export function extractComplaintRoleFields(permissionSnapshot = {}) {
  return {
    role: (permissionSnapshot.allowedUserRoleIds || []).filter(Boolean),
    nextRoles: (permissionSnapshot.nextRoleIds || []).filter(Boolean),
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

export function attachComplaintViewerAccess(complaint, user) {
  const userRoleIds = (user?.userRole || []).map((role) =>
    typeof role === "string" ? role : String(role?._id || role),
  );
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
      nextPermissions.length > 0,
  };
}
