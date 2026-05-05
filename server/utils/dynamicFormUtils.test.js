import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFieldMap,
  evaluateConditionalRules,
  normalizeDynamicFormPayload,
  validateSubmissionData,
} from "./dynamicFormUtils.js";

test("normalizeDynamicFormPayload trims values, generates keys, and orders sections/fields", () => {
  const normalized = normalizeDynamicFormPayload({
    name: " Service Intake Form ",
    description: "  Used for intake  ",
    isActive: true,
    workflowConfig: {
      initialStatus: "  triage  ",
      allowComments: true,
    },
    sections: [
      {
        id: "sec-b",
        title: " Customer Details ",
        order: 9,
        fields: [
          {
            id: "field-b",
            label: " Full Name ",
            type: "text",
            order: 4,
            validations: { required: true, minLength: 2 },
          },
        ],
      },
      {
        id: "sec-a",
        title: "Meta",
        order: 1,
        fields: [
          {
            id: "field-a",
            key: "priority",
            label: "Priority",
            type: "select",
            order: 3,
            options: [{ label: "High", value: "high" }],
          },
        ],
      },
    ],
  });

  assert.equal(normalized.slug, "service-intake-form");
  assert.equal(normalized.sections[0].key, "meta");
  assert.equal(normalized.sections[1].fields[0].key, "fullName");
  assert.equal(normalized.workflowConfig.initialStatus, "triage");
});

test("evaluateConditionalRules supports equals, notEquals, in, includes and isEmpty", () => {
  const data = {
    issueType: "technical",
    tags: ["urgent", "vip"],
    notes: "",
  };

  assert.equal(
    evaluateConditionalRules(
      [{ field: "issueType", operator: "equals", value: "technical" }],
      data,
    ),
    true,
  );
  assert.equal(
    evaluateConditionalRules(
      [{ field: "issueType", operator: "notEquals", value: "billing" }],
      data,
    ),
    true,
  );
  assert.equal(
    evaluateConditionalRules(
      [{ field: "issueType", operator: "in", value: ["technical", "support"] }],
      data,
    ),
    true,
  );
  assert.equal(
    evaluateConditionalRules(
      [{ field: "tags", operator: "includes", value: "vip" }],
      data,
    ),
    true,
  );
  assert.equal(
    evaluateConditionalRules(
      [{ field: "notes", operator: "isEmpty" }],
      data,
    ),
    true,
  );
});

test("validateSubmissionData validates visible fields only", () => {
  const form = normalizeDynamicFormPayload({
    name: "Test Form",
    sections: [
      {
        title: "Details",
        fields: [
          {
            label: "Issue Type",
            key: "issueType",
            type: "select",
            validations: { required: true },
            options: [
              { label: "Technical", value: "technical" },
              { label: "Billing", value: "billing" },
            ],
          },
          {
            label: "Technical Notes",
            key: "technicalNotes",
            type: "textarea",
            validations: { required: true, minLength: 5 },
            conditions: [
              { field: "issueType", operator: "equals", value: "technical" },
            ],
          },
        ],
      },
    ],
  });

  const fieldMap = buildFieldMap(form);

  const hiddenFieldErrors = validateSubmissionData(
    form,
    fieldMap,
    { issueType: "billing", technicalNotes: "" },
  );
  assert.deepEqual(hiddenFieldErrors, {});

  const visibleFieldErrors = validateSubmissionData(
    form,
    fieldMap,
    { issueType: "technical", technicalNotes: "bad" },
  );
  assert.equal(visibleFieldErrors.technicalNotes, "Technical Notes must be at least 5 characters");
});
