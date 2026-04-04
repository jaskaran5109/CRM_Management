import express from "express";
import { protect } from "../middleware/auth.js";
import Customer from "../models/CXData.js";
import User from "../models/User.js";
import Status from "../models/Status.js";
import RoleStatus from "../models/RoleStatus.js";
import UserRole from "../models/UserRole.js";
import CXServiceCategory from "../models/CXServiceCategory.js";

const router = express.Router();

// Get Dashboard Overview Stats - CRM Focused
router.get("/stats", protect, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      role: { $in: ["user", "admin"] },
    });
    const inactiveUsers = Math.max(0, totalUsers - activeUsers);

    const today = new Date();
    const last7 = new Date(today);
    last7.setDate(last7.getDate() - 7);
    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);

    const newUsersLast7 = await User.countDocuments({
      createdAt: { $gte: last7 },
    });
    const newUsersLast30 = await User.countDocuments({
      createdAt: { $gte: last30 },
    });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCustomers = await Customer.countDocuments();
    const newCustomersToday = await Customer.countDocuments({
      callReceiveDate: { $gte: new Date(today.setHours(0, 0, 0, 0)) },
    });
    const newCustomers7d = await Customer.countDocuments({
      callReceiveDate: { $gte: last7 },
    });
    const newCustomers30d = await Customer.countDocuments({
      callReceiveDate: { $gte: last30 },
    });

    const statusMap = {};
    const statusDocs = await Status.find({});
    statusDocs.forEach((status) => {
      statusMap[status.name.toLowerCase()] = status._id;
    });

    // Customer status groups
    const customerByStatus = await Customer.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "statuses",
          localField: "_id",
          foreignField: "_id",
          as: "status",
        },
      },
      { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$status.name", "Unassigned"] },
          count: 1,
        },
      },
    ]);

    const resolvedStatus = await Status.findOne({
      name: { $regex: /^resolved$|^issue resolved$/i },
    });

    // Calculate converted and pending customers
    let converted = 0;
    if (resolvedStatus) {
      converted = await Customer.countDocuments({ status: resolvedStatus._id });
    }
    const pending = totalCustomers - converted;

    const rolePerformance = await RoleStatus.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userRole",
          foreignField: "userRole",
          as: "users",
        },
      },
      {
        $lookup: {
          from: "userroles",
          localField: "userRole",
          foreignField: "_id",
          as: "userRole",
        },
      },
      {
        $lookup: {
          from: "rolestatuses",
          localField: "nextRoles",
          foreignField: "_id",
          as: "nextRoles",
        },
      },
      {
        $addFields: {
          userCount: { $size: "$users" },
          userRole: { $arrayElemAt: ["$userRole", 0] },
        },
      },
      {
        $project: {
          users: 0,
          __v: 0,
        },
      },
      { $limit: 12 },
    ]);

    const customersByCategory = await Customer.aggregate([
      { $group: { _id: "$serviceCategory", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "cxservicecategories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$category.name", "Unassigned"] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    const workflowDocs = await RoleStatus.find({})
      .populate("nextRoles", "name")
      .populate("userRole", "name")
      .limit(100);
    const transitionStats = workflowDocs.map((doc) => ({
      roleStatus: doc.name,
      from: doc.userRole?.name || null,
      nextRoles: doc.nextRoles.map((n) => n.name),
    }));

    res.json({
      success: true,
      data: {
        users: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          usersByRole,
          newUsersLast7,
          newUsersLast30,
        },
        customers: {
          totalCustomers,
          newCustomersToday,
          newCustomers7d,
          newCustomers30d,
          converted,
          pending,
          byStatus: customerByStatus,
        },
        rolePerformance,
        categoryInsights: customersByCategory,
        workflowInsights: {
          transitions: transitionStats,
          bottlenecks: workflowDocs
            .filter((d) => !d.nextRoles || d.nextRoles.length === 0)
            .map((d) => d.name),
          avgTransitionTimeMinutes: null,
        },
        statusDistribution: customerByStatus,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard stats" });
  }
});

// Get Revenue Analytics Data
router.get("/revenue-analytics", protect, async (req, res) => {
  try {
    const range = req.query.range || "12m";
    let monthsBack = 11;

    if (range === "3m") monthsBack = 2;
    else if (range === "6m") monthsBack = 5;
    else if (range === "1m") monthsBack = 0;

    const months = [];
    const counts = [];

    for (let i = monthsBack; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);

      const count = await Customer.countDocuments({
        callReceiveDate: { $gte: startDate, $lt: endDate },
      });

      const monthName = new Date(year, month).toLocaleDateString("en-US", {
        month: "short",
      });
      months.push(`${monthName}`);
      counts.push(count);
    }

    res.json({
      success: true,
      data: {
        months,
        counts,
      },
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
    });
  }
});

// Get Customer Distribution by Status
router.get("/customer-distribution", protect, async (req, res) => {
  try {
    const distribution = await Customer.aggregate([
      {
        $group: {
          _id: "$assignedStatus", // ✅ grouping by assignedStatus
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "rolestatuses", // ✅ FIXED
          localField: "_id",
          foreignField: "_id",
          as: "statusDetail",
        },
      },
      {
        $unwind: {
          path: "$statusDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: {
            $ifNull: ["$statusDetail.name", "Unassigned"],
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const labels = distribution.map((d) => d.name);
    const data = distribution.map((d) => d.count);
    const colors = [
      "#e94560",
      "#0066cc",
      "#27ae60",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
    ];

    res.json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Customer distribution error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer distribution",
    });
  }
});

// Get Top Models
router.get("/top-models", protect, async (req, res) => {
  try {
    const topModels = await Customer.aggregate([
      {
        $match: { model: { $ne: null } },
      },
      {
        $group: {
          _id: "$model",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "cxmodels",
          localField: "_id",
          foreignField: "_id",
          as: "modelDetail",
        },
      },
      {
        $unwind: "$modelDetail",
      },
      {
        $project: {
          _id: 1,
          modelName: "$modelDetail.name",
          count: 1,
          sales: { $multiply: ["$count", 250] }, // Mock sales calculation
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: topModels,
    });
  } catch (error) {
    console.error("Top models error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top models",
    });
  }
});

// Get Service Categories Stats
router.get("/service-stats", protect, async (req, res) => {
  try {
    const categories = await Customer.aggregate([
      {
        $match: { serviceCategory: { $ne: null } },
      },
      {
        $group: {
          _id: "$serviceCategory",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "cxservicecategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetail",
        },
      },
      {
        $unwind: "$categoryDetail",
      },
      {
        $project: {
          _id: 1,
          categoryName: "$categoryDetail.name",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Service stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service stats",
    });
  }
});

// Get Recent Leads
router.get("/recent-leads", protect, async (req, res) => {
  try {
    const leads = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("model", "name")
      .populate("serviceCategory", "name")
      .populate("status", "name")
      .populate("assignedStatus", "name");

    res.json({
      success: true,
      data: leads.map((lead) => ({
        id: lead._id,
        name: lead.customerName,
        email: lead.customerEmail,
        status: lead.status?.name || "Unassigned",
        model: lead.model?.name || "None",
        category: lead.serviceCategory?.name || "None",
        assignedStatus: lead.assignedStatus?.name || "None",
        received: lead.callReceiveDate,
      })),
    });
  } catch (error) {
    console.error("Recent leads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent leads",
    });
  }
});

// Get State-wise Distribution
router.get("/state-distribution", protect, async (req, res) => {
  try {
    const distribution = await Customer.aggregate([
      {
        $match: { state: { $ne: null, $ne: "" } },
      },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const labels = distribution.map((d) => d._id);
    const data = distribution.map((d) => d.count);
    const colors = [
      "#e94560",
      "#0066cc",
      "#27ae60",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
    ];

    res.json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
    });
  } catch (error) {
    console.error("State distribution error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch state distribution",
    });
  }
});

// New combined analytics endpoint (for dashboard quick load)
router.get("/analytics", protect, async (req, res) => {
  try {
    const range = req.query.range || "12m";
    const monthSteps =
      range === "1m" ? 1 : range === "3m" ? 3 : range === "6m" ? 6 : 12;
    const now = new Date();

    const typeMap = {
      1: "1m",
      3: "3m",
      6: "6m",
      12: "12m",
    };

    const months = [];
    const growthCounts = [];

    for (let i = monthSteps - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleDateString("en-US", { month: "short" }));

      const startDate = new Date(date);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const monthlyCount = await Customer.countDocuments({
        callReceiveDate: { $gte: startDate, $lt: endDate },
      });
      growthCounts.push(monthlyCount);
    }

    const statusAgg = await Customer.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "statuses",
          localField: "_id",
          foreignField: "_id",
          as: "statusDetail",
        },
      },
      { $unwind: { path: "$statusDetail", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$statusDetail.name", "Unassigned"] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    const serviceAgg = await Customer.aggregate([
      { $group: { _id: "$serviceCategory", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "cxservicecategories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$category.name", "Unassigned"] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 7 },
    ]);

    const revenueEstimate = await Customer.aggregate([
      { $match: { model: { $ne: null } } },
      { $group: { _id: "$model", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "cxmodels",
          localField: "_id",
          foreignField: "_id",
          as: "modelDetail",
        },
      },
      { $unwind: { path: "$modelDetail", preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, modelName: "$modelDetail.name" } },
    ]);

    const revenue = revenueEstimate.reduce(
      (acc, item) => acc + item.count * 250,
      0,
    );

    const totalLeads = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({
      status: { $ne: null },
    });
    const totalUsers = await User.countDocuments();
    const conversionRate = totalLeads
      ? ((activeCustomers / totalLeads) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalLeads,
          totalUsers,
          activeCustomers,
          activeUsers: totalUsers,
          revenue,
          conversionRate: Number(conversionRate),
          trendPercent: growthCounts.length
            ? Number(
                ((growthCounts[growthCounts.length - 1] - growthCounts[0]) /
                  Math.max(growthCounts[0], 1)) *
                  100,
              ).toFixed(1)
            : 0,
        },
        trends: {
          labels: months,
          values: growthCounts,
        },
        distribution: statusAgg.map((node) => ({
          name: node.name,
          value: node.count,
        })),
        categories: serviceAgg.map((node) => ({
          name: node.name,
          value: node.count,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
    });
  }
});

// New trends endpoint with daily points
router.get("/trends", protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days || "30", 10);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days + 1);

    const daily = await Customer.aggregate([
      {
        $match: {
          callReceiveDate: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$callReceiveDate" },
            month: { $month: "$callReceiveDate" },
            day: { $dayOfMonth: "$callReceiveDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = 0;
    }

    daily.forEach((item) => {
      const stableDate = new Date(
        item._id.year,
        item._id.month - 1,
        item._id.day,
      );
      const dateKey = stableDate.toISOString().slice(0, 10);
      dateMap[dateKey] = item.count;
    });

    const dailyData = Object.keys(dateMap).map((date) => ({
      date,
      count: dateMap[date],
    }));

    res.json({ success: true, data: dailyData });
  } catch (error) {
    console.error("Dashboard trends error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard trends" });
  }
});

export default router;
