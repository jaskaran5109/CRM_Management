import mongoose from "mongoose";

const dynamicFormOptionSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true },
    value: { type: String, trim: true, required: true },
  },
  { _id: false },
);

const conditionalRuleSchema = new mongoose.Schema(
  {
    field: { type: String, trim: true, required: true },
    operator: {
      type: String,
      enum: [
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
      ],
      default: "equals",
    },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const fieldValidationSchema = new mongoose.Schema(
  {
    required: { type: Boolean, default: false },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    regex: { type: String, trim: true, default: "" },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
  },
  { _id: false },
);

const fieldPermissionSchema = new mongoose.Schema(
  {
    userRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserRole",
      },
    ],
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: true },
  },
  { _id: false },
);

const fieldUiSchema = new mongoose.Schema(
  {
    readOnly: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
  },
  { _id: false },
);

const dynamicFormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    placeholder: { type: String, trim: true, default: "" },
    helperText: { type: String, trim: true, default: "" },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: "" },
    validations: { type: fieldValidationSchema, default: () => ({}) },
    permissions: { type: fieldPermissionSchema, default: () => ({}) },
    ui: { type: fieldUiSchema, default: () => ({}) },
    options: { type: [dynamicFormOptionSchema], default: [] },
    conditions: { type: [conditionalRuleSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const dynamicFormSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    order: { type: Number, default: 0 },
    fields: { type: [dynamicFormFieldSchema], default: [] },
  },
  { _id: false },
);

const workflowConfigSchema = new mongoose.Schema(
  {
    initialStatus: { type: String, trim: true, default: "new" },
    allowComments: { type: Boolean, default: true },
    allowAssignments: { type: Boolean, default: false },
    allowedStatusTransitions: [{ type: String, trim: true }],
  },
  { _id: false },
);

const dynamicFormSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Form name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Form slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sections: {
      type: [dynamicFormSectionSchema],
      default: [],
      validate: {
        validator(value) {
          const sectionKeys = new Set();
          for (const section of value || []) {
            const normalizedSectionKey = String(section.key || "").toLowerCase();
            if (!normalizedSectionKey || sectionKeys.has(normalizedSectionKey)) {
              return false;
            }
            sectionKeys.add(normalizedSectionKey);

            const fieldKeys = new Set();
            for (const field of section.fields || []) {
              const normalizedFieldKey = String(field.key || "").toLowerCase();
              if (!normalizedFieldKey || fieldKeys.has(normalizedFieldKey)) {
                return false;
              }
              fieldKeys.add(normalizedFieldKey);
            }
          }
          return true;
        },
        message: "Section keys and field keys must be unique within their sections",
      },
    },
    workflowConfig: {
      type: workflowConfigSchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

dynamicFormSchema.index({ name: 1, createdAt: -1 });
dynamicFormSchema.index({ slug: 1, isActive: 1 });

export default mongoose.model("DynamicForm", dynamicFormSchema);
