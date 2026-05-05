import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyField,
  createEmptySection,
  getInitialSubmissionValues,
  getVisibleSections,
  validateDynamicFormValues,
} from "./dynamicFormUtils.js";

test("createEmptySection and createEmptyField return usable defaults", () => {
  const section = createEmptySection(2);
  const field = createEmptyField("text", 3);

  assert.equal(section.order, 2);
  assert.equal(section.fields.length, 0);
  assert.equal(field.type, "text");
  assert.equal(field.validations.required, false);
});

test("getInitialSubmissionValues seeds defaults for supported field types", () => {
  const values = getInitialSubmissionValues({
    sections: [
      {
        fields: [
          {
            key: "fullName",
            type: "text",
            defaultValue: "Jane Doe",
          },
          {
            key: "tags",
            type: "multiselect",
            defaultValue: ["vip"],
          },
          {
            key: "active",
            type: "switch",
            defaultValue: true,
          },
        ],
      },
    ],
  });

  assert.equal(values.fullName, "Jane Doe");
  assert.deepEqual(values.tags, ["vip"]);
  assert.equal(values.active, true);
});

test("getVisibleSections filters hidden conditional fields", () => {
  const form = {
    sections: [
      {
        key: "details",
        title: "Details",
        fields: [
          {
            key: "issueType",
            label: "Issue Type",
            type: "select",
          },
          {
            key: "billingCode",
            label: "Billing Code",
            type: "text",
            conditions: [
              { field: "issueType", operator: "equals", value: "billing" },
            ],
          },
        ],
      },
    ],
  };

  const visibleSections = getVisibleSections(form, { issueType: "technical" });
  assert.equal(visibleSections[0].fields.length, 1);
});

test("validateDynamicFormValues returns rule errors for visible fields only", () => {
  const form = {
    sections: [
      {
        fields: [
          {
            key: "issueType",
            label: "Issue Type",
            type: "select",
            validations: { required: true },
          },
          {
            key: "phone",
            label: "Phone",
            type: "phone",
            validations: { required: true, regex: "^[0-9]{10}$" },
            conditions: [
              { field: "issueType", operator: "equals", value: "billing" },
            ],
          },
        ],
      },
    ],
  };

  const hiddenErrors = validateDynamicFormValues(form, {
    issueType: "technical",
    phone: "",
  });
  assert.deepEqual(hiddenErrors, {});

  const visibleErrors = validateDynamicFormValues(form, {
    issueType: "billing",
    phone: "123",
  });
  assert.equal(visibleErrors.phone, "Phone is invalid");
});
