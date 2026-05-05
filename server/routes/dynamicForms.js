import express from "express";

import { protect, adminOnly } from "../middleware/auth.js";
import {
  createDynamicForm,
  createFormSubmission,
  deleteDynamicForm,
  getDynamicForm,
  getFormSubmission,
  listDynamicForms,
  listFormSubmissions,
  updateDynamicForm,
  updateDynamicFormStatus,
  updateFormSubmission,
} from "../controllers/dynamicFormController.js";

const router = express.Router();

router.use(protect);

router.get("/", listDynamicForms);
router.get("/submissions", listFormSubmissions);
router.get("/submissions/:id", getFormSubmission);
router.get("/:idOrSlug", getDynamicForm);
router.post("/:slug/submissions", createFormSubmission);
router.patch("/submissions/:id", updateFormSubmission);

router.post("/", adminOnly, createDynamicForm);
router.put("/:id", adminOnly, updateDynamicForm);
router.patch("/:id/status", adminOnly, updateDynamicFormStatus);
router.delete("/:id", adminOnly, deleteDynamicForm);

export default router;
