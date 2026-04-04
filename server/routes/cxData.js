import express from "express";
import mongoose from "mongoose";
import Customer from "../models/CXData.js";
import CXModel from "../models/CXModel.js";
import CXServiceCategory from "../models/CXServiceCategory.js";
import RoleStatus from "../models/RoleStatus.js";
import { protect, adminOnly } from "../middleware/auth.js";
import Status from "../models/Status.js";

const router = express.Router();

// helper to validate ObjectId refs
const validateRef = async (id, Model, label) => {
  if (id === null || id === "") return null;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label} id`);
  }

  const exists = await Model.findById(id);
  if (!exists) {
    throw new Error(`${label} not found`);
  }

  return id;
};
router.get("/", protect, async (req, res) => {
  try {
    const {
      search = "",
      state,
      city,
      status,
      assignedStatus,
      serviceCategory,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // 🔍 SEARCH (multi-field)
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { contactNo: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    // 🎯 FILTERS
    if (state) query.state = state;
    if (city) query.city = city;
    if (status) query.status = status;
    if (assignedStatus) query.assignedStatus = assignedStatus;
    if (serviceCategory) query.serviceCategory = serviceCategory;

    const sortField = sort || "createdAt";
    // 🔽 SORT
    const sortOption = {
      [sortField]: order === "asc" ? 1 : -1,
    };

    // 📄 PAGINATION
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate("model", "name")
        .populate("serviceCategory", "name")
        .populate("assignedStatus", "name")
        .populate("status", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),

      Customer.countDocuments(query),
    ]);

    res.json({
      data: customers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET CX DATA ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ CREATE SINGLE CUSTOMER
router.post("/", protect, async (req, res) => {
  try {
    const {
      callReceiveDate,
      customerEmail,
      customerName,
      contactNo,
      address,
      pincode,
      state,
      city,
      model,
      serviceCategory,
      assignedStatus,
      status,
    } = req.body;

    if (!callReceiveDate) {
      return res.status(400).json({ message: "Call receive date is required" });
    }

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!contactNo || !contactNo.trim()) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    if (!customerEmail || !customerEmail.trim()) {
      return res.status(400).json({ message: "Customer email is required" });
    }

    if (customerEmail && customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    const validatedModel = model
      ? await validateRef(model, CXModel, "CX model")
      : null;

    const validatedServiceCategory = serviceCategory
      ? await validateRef(
          serviceCategory,
          CXServiceCategory,
          "CX service category",
        )
      : null;

    const validatedAssignedStatus = assignedStatus
      ? await validateRef(assignedStatus, RoleStatus, "Assigned status")
      : null;

    let validatedStatus = null;

    if (status) {
      if (!mongoose.Types.ObjectId.isValid(status)) {
        return res.status(400).json({ message: "Invalid status id" });
      }

      const statusExists = await Status.findById(status);
      if (!statusExists) {
        return res.status(400).json({ message: "Status not found" });
      }

      validatedStatus = status;
    }

    const customer = await Customer.create({
      callReceiveDate,
      customerEmail: customerEmail.trim(),
      customerName: customerName.trim(),
      contactNo: contactNo.trim(),
      address: address?.trim() || "",
      pincode: pincode?.trim() || "",
      state: state?.trim() || "",
      city: city?.trim() || "",
      model: validatedModel,
      serviceCategory: validatedServiceCategory,
      assignedStatus: validatedAssignedStatus,
      status: validatedStatus,
    });

    const populatedCustomer = await Customer.findById(customer._id)
      .populate("model", "name")
      .populate("serviceCategory", "name")
      .populate("assignedStatus", "name")
      .populate("status", "name");

    res.status(201).json(populatedCustomer);
  } catch (err) {
    console.error("CREATE CX DATA ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ CREATE MULTIPLE CUSTOMERS
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { customers, status } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: "Customers array is required" });
    }

    let validatedStatus = null;

    if (status) {
      if (!mongoose.Types.ObjectId.isValid(status)) {
        return res.status(400).json({ message: "Invalid status id" });
      }

      const statusExists = await Status.findById(status);
      if (!statusExists) {
        return res.status(400).json({ message: "Status not found" });
      }

      validatedStatus = status;
    }

    const preparedCustomers = [];
    const errors = [];

    for (let i = 0; i < customers.length; i++) {
      const item = customers[i];

      try {
        const {
          customerEmail,
          callReceiveDate,
          customerName,
          contactNo,
          address,
          pincode,
          state,
          city,
          model,
          serviceCategory,
          assignedStatus,
        } = item;

        if (!customerEmail) {
          throw { field: "customerEmail", message: "Email is required" };
        }

        if (!callReceiveDate) {
          throw { field: "callReceiveDate", message: "Date is required" };
        }

        if (!customerName?.trim()) {
          throw { field: "customerName", message: "Name is required" };
        }

        if (!contactNo?.trim()) {
          throw { field: "contactNo", message: "Contact is required" };
        }

        const validatedModel = model
          ? await validateRef(model, CXModel, "CX model")
          : null;

        preparedCustomers.push({
          customerEmail: customerEmail.trim(),
          callReceiveDate,
          customerName: customerName.trim(),
          contactNo: contactNo.trim(),
          address: address?.trim() || "",
          pincode: pincode?.trim() || "",
          state: state?.trim() || "",
          city: city?.trim() || "",
          model: validatedModel,
          serviceCategory,
          assignedStatus,
          status: validatedStatus,
        });
      } catch (err) {
        errors.push({
          row: i + 1,
          field: err.field || "unknown",
          message: err.message || err,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        successCount: preparedCustomers.length,
        failedCount: errors.length,
        errors,
      });
    }

    const created = await Customer.insertMany(preparedCustomers);

    const createdIds = created.map((item) => item._id);

    const populatedCreated = await Customer.find({ _id: { $in: createdIds } })
      .populate("model", "name")
      .populate("serviceCategory", "name")
      .populate("assignedStatus", "name")
      .populate("status", "name")
      .sort({ createdAt: -1 });

    res.status(201).json(populatedCreated);
  } catch (err) {
    console.error("BULK CREATE CX DATA ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ UPDATE CUSTOMER
router.put("/:id", protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer data not found" });
    }

    const {
      customerEmail,
      callReceiveDate,
      customerName,
      contactNo,
      address,
      pincode,
      state,
      city,
      model,
      serviceCategory,
      assignedStatus,
      status,
    } = req.body;

    if (callReceiveDate !== undefined) {
      customer.callReceiveDate = callReceiveDate;
    }

    if (customerEmail !== undefined) {
      if (typeof customerEmail !== "string" || !customerEmail.trim()) {
        return res.status(400).json({ message: "Customer email is required" });
      }
      customer.customerEmail = customerEmail.trim();
    }

    if (customerName !== undefined) {
      if (typeof customerName !== "string" || !customerName.trim()) {
        return res.status(400).json({ message: "Customer name is required" });
      }
      customer.customerName = customerName.trim();
    }

    if (contactNo !== undefined) {
      if (typeof contactNo !== "string" || !contactNo.trim()) {
        return res.status(400).json({ message: "Contact number is required" });
      }
      customer.contactNo = contactNo.trim();
    }

    if (address !== undefined) customer.address = address?.trim() || "";
    if (pincode !== undefined) customer.pincode = pincode?.trim() || "";
    if (state !== undefined) customer.state = state?.trim() || "";
    if (city !== undefined) customer.city = city?.trim() || "";

    if (model !== undefined) {
      customer.model =
        model === null || model === ""
          ? null
          : await validateRef(model, CXModel, "CX model");
    }

    if (serviceCategory !== undefined) {
      customer.serviceCategory =
        serviceCategory === null || serviceCategory === ""
          ? null
          : await validateRef(
              serviceCategory,
              CXServiceCategory,
              "CX service category",
            );
    }

    if (assignedStatus !== undefined) {
      if (assignedStatus === null || assignedStatus === "") {
        customer.assignedStatus = null;
      } else {
        // validate new status
        const newStatus =
          await RoleStatus.findById(assignedStatus).populate("userRole");

        if (!newStatus) {
          return res.status(400).json({ message: "Assigned status not found" });
        }

        customer.assignedStatus = assignedStatus;
      }
    }

    if (status !== undefined) {
      if (status === null || status === "") {
        customer.status = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(status)) {
          return res.status(400).json({ message: "Invalid status id" });
        }

        const statusExists = await Status.findById(status);
        if (!statusExists) {
          return res.status(400).json({ message: "Status not found" });
        }

        customer.status = status;
      }
    }

    const updated = await customer.save();

    const populatedUpdated = await Customer.findById(updated._id)
      .populate("model", "name")
      .populate("serviceCategory", "name")
      .populate("assignedStatus", "name")
      .populate("status", "name");

    res.json(populatedUpdated);
  } catch (err) {
    console.error("UPDATE CX DATA ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ DELETE CUSTOMER
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer data not found" });
    }

    await customer.deleteOne();

    res.json({ message: "Customer data deleted successfully" });
  } catch (err) {
    console.error("DELETE CX DATA ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ BULK DELETE CUSTOMERS
router.post("/bulk-delete", protect, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided for deletion" });
    }

    // Validate all IDs are valid ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid IDs provided" });
    }

    const result = await Customer.deleteMany({ _id: { $in: validIds } });

    res.json({
      message: "Customer data deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("BULK DELETE CX DATA ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
