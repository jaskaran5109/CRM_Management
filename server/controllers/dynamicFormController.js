import mongoose from "mongoose";

import DynamicForm from "../models/DynamicForm.js";
import FormSubmission from "../models/FormSubmission.js";
import User from "../models/User.js";
import {
  buildFieldMap,
  getVisibleSections,
  normalizeDynamicFormPayload,
  slugifyFormName,
  validateSubmissionData,
} from "../utils/dynamicFormUtils.js";

const FORM_POPULATE = [
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
];

const SUBMISSION_POPULATE = [
  { path: "submittedBy", select: "name email role userRole" },
  { path: "assignedTo", select: "name email role userRole" },
  { path: "comments.createdBy", select: "name email role" },
  { path: "auditLogs.changedBy", select: "name email role" },
];

function buildPagination(query, defaults = {}) {
  const page = Math.max(1, Number(query.page || defaults.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || defaults.limit || 10)));
  const sort = String(query.sort || defaults.sort || "createdAt");
  const order = String(query.order || defaults.order || "desc") === "asc" ? 1 : -1;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortObj: { [sort]: order },
  };
}

function sanitizeSubmissionData(rawData = {}, visibleSections = []) {
  const visibleKeys = new Set();
  for (const section of visibleSections) {
    for (const field of section.fields || []) {
      visibleKeys.add(field.key);
    }
  }

  const sanitizedEntries = Object.entries(rawData).filter(([key]) => visibleKeys.has(key));
  return new Map(sanitizedEntries);
}

function filterFormForUser(form, reqUser) {
  const roleNames = new Set([
    reqUser?.role,
    ...(Array.isArray(reqUser?.userRole)
      ? reqUser.userRole.map((role) => role?.name || role).filter(Boolean)
      : []),
  ]);

  const sections = (form.sections || [])
    .map((section) => ({
      ...section,
      fields: (section.fields || [])
        .filter((field) => {
        const permittedRoles = field.permissions?.roles || [];
        const roleAllowed =
          permittedRoles.length === 0 || permittedRoles.some((role) => roleNames.has(role));

        if (!roleAllowed || field.permissions?.canView === false) {
          return false;
        }

        return true;
        })
        .map((field) => ({
          ...field,
          ui: {
            ...(field.ui || {}),
            readOnly: field.ui?.readOnly || field.permissions?.canEdit === false,
          },
        })),
    }))
    .filter((section) => section.fields.length > 0);

  return {
    ...form,
    sections,
  };
}

async function ensureUniqueSlug(slug, excludeId = null) {
  const existing = await DynamicForm.findOne({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select("_id");

  return !existing;
}

export async function listDynamicForms(req, res) {
  try {
    const {
      search,
      isActive,
      includeInactive,
    } = req.query;

    const { page, limit, skip, sortObj } = buildPagination(req.query);
    const query = {};

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { slug: regex }, { description: regex }];
    }

    if (req.user.role !== "admin" || includeInactive !== "true") {
      query.isActive = true;
    }

    if (req.user.role === "admin" && isActive !== undefined && isActive !== "") {
      query.isActive = String(isActive) === "true";
    }

    const [forms, total] = await Promise.all([
      DynamicForm.find(query)
        .populate(FORM_POPULATE)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      DynamicForm.countDocuments(query),
    ]);

    const filteredForms =
      req.user.role === "admin"
        ? forms
        : forms.map((form) => filterFormForUser(form, req.user));

    res.json({
      message: "Dynamic forms retrieved successfully",
      data: filteredForms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List dynamic forms error:", error);
    res.status(500).json({ message: "Failed to fetch dynamic forms", error: error.message });
  }
}

export async function getDynamicForm(req, res) {
  try {
    const { idOrSlug } = req.params;
    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: slugifyFormName(idOrSlug) || String(idOrSlug).trim().toLowerCase() };

    const form = await DynamicForm.findOne(query).populate(FORM_POPULATE).lean();
    if (!form) {
      return res.status(404).json({ message: "Dynamic form not found" });
    }

    if (!form.isActive && req.user.role !== "admin") {
      return res.status(404).json({ message: "Dynamic form not found" });
    }

    const payload = req.user.role === "admin" ? form : filterFormForUser(form, req.user);

    res.json({
      message: "Dynamic form retrieved successfully",
      data: payload,
    });
  } catch (error) {
    console.error("Get dynamic form error:", error);
    res.status(500).json({ message: "Failed to fetch dynamic form", error: error.message });
  }
}

export async function createDynamicForm(req, res) {
  try {
    const normalized = normalizeDynamicFormPayload(req.body);

    if (!normalized.name) {
      return res.status(400).json({ message: "Form name is required" });
    }

    if (normalized.sections.length === 0) {
      return res.status(400).json({ message: "At least one section is required" });
    }

    const slugAvailable = await ensureUniqueSlug(normalized.slug);
    if (!slugAvailable) {
      return res.status(400).json({ message: "Form slug already exists" });
    }

    const form = await DynamicForm.create({
      ...normalized,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const populated = await DynamicForm.findById(form._id).populate(FORM_POPULATE);

    res.status(201).json({
      message: "Dynamic form created successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Create dynamic form error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", error: error.message });
    }
    res.status(500).json({ message: "Failed to create dynamic form", error: error.message });
  }
}

export async function updateDynamicForm(req, res) {
  try {
    const existing = await DynamicForm.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Dynamic form not found" });
    }

    const normalized = normalizeDynamicFormPayload(req.body, existing);

    if (!normalized.name) {
      return res.status(400).json({ message: "Form name is required" });
    }

    if (normalized.sections.length === 0) {
      return res.status(400).json({ message: "At least one section is required" });
    }

    const slugAvailable = await ensureUniqueSlug(normalized.slug, existing._id);
    if (!slugAvailable) {
      return res.status(400).json({ message: "Form slug already exists" });
    }

    Object.assign(existing, normalized, { updatedBy: req.user._id });
    await existing.save();

    const populated = await DynamicForm.findById(existing._id).populate(FORM_POPULATE);

    res.json({
      message: "Dynamic form updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update dynamic form error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", error: error.message });
    }
    res.status(500).json({ message: "Failed to update dynamic form", error: error.message });
  }
}

export async function deleteDynamicForm(req, res) {
  try {
    const form = await DynamicForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Dynamic form not found" });
    }

    await Promise.all([
      DynamicForm.findByIdAndDelete(req.params.id),
      FormSubmission.deleteMany({ formId: req.params.id }),
    ]);

    res.json({ message: "Dynamic form deleted successfully" });
  } catch (error) {
    console.error("Delete dynamic form error:", error);
    res.status(500).json({ message: "Failed to delete dynamic form", error: error.message });
  }
}

export async function updateDynamicFormStatus(req, res) {
  try {
    const form = await DynamicForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Dynamic form not found" });
    }

    form.isActive = Boolean(req.body.isActive);
    form.updatedBy = req.user._id;
    await form.save();

    res.json({
      message: `Dynamic form ${form.isActive ? "activated" : "deactivated"} successfully`,
      data: form,
    });
  } catch (error) {
    console.error("Update dynamic form status error:", error);
    res.status(500).json({ message: "Failed to update dynamic form status", error: error.message });
  }
}

export async function listFormSubmissions(req, res) {
  try {
    const {
      search,
      formSlug,
      formId,
      status,
      assignedTo,
      submittedBy,
      startDate,
      endDate,
    } = req.query;

    const { page, limit, skip, sortObj } = buildPagination(req.query);
    const query = {};

    if (formSlug?.trim()) {
      query.formSlug = formSlug.trim().toLowerCase();
    }

    if (formId) {
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({ message: "Invalid form id" });
      }
      query.formId = formId;
    }

    if (status?.trim()) {
      query.status = status.trim().toLowerCase();
    }

    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: "Invalid assigned user id" });
      }
      query.assignedTo = assignedTo;
    }

    if (submittedBy) {
      if (!mongoose.Types.ObjectId.isValid(submittedBy)) {
        return res.status(400).json({ message: "Invalid submitted user id" });
      }
      query.submittedBy = submittedBy;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (req.user.role !== "admin") {
      query.$or = [{ submittedBy: req.user._id }, { assignedTo: req.user._id }];
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { formSlug: regex },
            { status: regex },
          ],
        },
      ];
    }

    const [submissions, total] = await Promise.all([
      FormSubmission.find(query)
        .populate(SUBMISSION_POPULATE)
        .populate("formId", "name slug isActive")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      FormSubmission.countDocuments(query),
    ]);

    res.json({
      message: "Form submissions retrieved successfully",
      data: submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List form submissions error:", error);
    res.status(500).json({ message: "Failed to fetch form submissions", error: error.message });
  }
}

export async function getFormSubmission(req, res) {
  try {
    const submission = await FormSubmission.findById(req.params.id)
      .populate(SUBMISSION_POPULATE)
      .populate("formId", "name slug sections workflowConfig isActive");

    if (!submission) {
      return res.status(404).json({ message: "Form submission not found" });
    }

    if (
      req.user.role !== "admin" &&
      String(submission.submittedBy?._id || submission.submittedBy) !== String(req.user._id) &&
      String(submission.assignedTo?._id || submission.assignedTo || "") !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Not authorized to view this submission" });
    }

    res.json({
      message: "Form submission retrieved successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Get form submission error:", error);
    res.status(500).json({ message: "Failed to fetch form submission", error: error.message });
  }
}

export async function createFormSubmission(req, res) {
  try {
    const { slug } = req.params;
    const form = await DynamicForm.findOne({ slug: slug.trim().toLowerCase(), isActive: true }).lean();

    if (!form) {
      return res.status(404).json({ message: "Dynamic form not found" });
    }

    const filteredForm = filterFormForUser(form, req.user);
    const fieldMap = buildFieldMap(filteredForm);
    const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
    const visibleSections = getVisibleSections(filteredForm, data);
    const errors = validateSubmissionData(filteredForm, fieldMap, data);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Form submission validation failed",
        errors,
      });
    }

    const submission = await FormSubmission.create({
      formId: form._id,
      formSlug: form.slug,
      submittedBy: req.user._id,
      assignedTo: null,
      status: form.workflowConfig?.initialStatus || "new",
      data: sanitizeSubmissionData(data, visibleSections),
      comments: [],
      auditLogs: [
        {
          action: "create",
          message: `Submission created by ${req.user.name}`,
          changedBy: req.user._id,
          metadata: {
            source: "dynamic-form",
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip,
          },
        },
      ],
    });

    const populated = await FormSubmission.findById(submission._id)
      .populate(SUBMISSION_POPULATE)
      .populate("formId", "name slug isActive");

    res.status(201).json({
      message: "Form submitted successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Create form submission error:", error);
    res.status(500).json({ message: "Failed to submit form", error: error.message });
  }
}

export async function updateFormSubmission(req, res) {
  try {
    const submission = await FormSubmission.findById(req.params.id).populate("formId");
    if (!submission) {
      return res.status(404).json({ message: "Form submission not found" });
    }

    const canEdit =
      req.user.role === "admin" ||
      String(submission.submittedBy) === String(req.user._id) ||
      String(submission.assignedTo || "") === String(req.user._id);

    if (!canEdit) {
      return res.status(403).json({ message: "Not authorized to update this submission" });
    }

    const {
      status,
      assignedTo,
      comment,
      data,
    } = req.body;

    if (status) {
      submission.status = String(status).trim().toLowerCase();
      submission.auditLogs.push({
        action: "status_update",
        message: `Status updated to ${submission.status}`,
        changedBy: req.user._id,
        metadata: { source: "dynamic-form" },
      });
    }

    if (assignedTo !== undefined) {
      if (assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          return res.status(400).json({ message: "Invalid assigned user id" });
        }

        const user = await User.findById(assignedTo).select("_id");
        if (!user) {
          return res.status(404).json({ message: "Assigned user not found" });
        }

        submission.assignedTo = assignedTo;
      } else {
        submission.assignedTo = null;
      }

      submission.auditLogs.push({
        action: "assignment_update",
        message: submission.assignedTo ? "Submission assigned" : "Submission unassigned",
        changedBy: req.user._id,
        metadata: { source: "dynamic-form" },
      });
    }

    if (data && typeof data === "object") {
      const form = submission.formId.toObject();
      const filteredForm = filterFormForUser(form, req.user);
      const fieldMap = buildFieldMap(filteredForm);
      const visibleSections = getVisibleSections(filteredForm, data);
      const errors = validateSubmissionData(filteredForm, fieldMap, data);

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          message: "Form submission validation failed",
          errors,
        });
      }

      submission.data = sanitizeSubmissionData(data, visibleSections);
      submission.auditLogs.push({
        action: "data_update",
        message: "Submission data updated",
        changedBy: req.user._id,
        metadata: { source: "dynamic-form" },
      });
    }

    if (comment?.trim()) {
      submission.comments.push({
        message: comment.trim(),
        createdBy: req.user._id,
      });
      submission.auditLogs.push({
        action: "comment_add",
        message: "Submission comment added",
        changedBy: req.user._id,
        metadata: { source: "dynamic-form" },
      });
    }

    await submission.save();

    const populated = await FormSubmission.findById(submission._id)
      .populate(SUBMISSION_POPULATE)
      .populate("formId", "name slug isActive");

    res.json({
      message: "Form submission updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update form submission error:", error);
    res.status(500).json({ message: "Failed to update form submission", error: error.message });
  }
}
