import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaChartLine,
  FaDollarSign,
  FaPercent,
  FaFilter,
  FaCalendarAlt,
} from "react-icons/fa";

import "./Dashboard.css";
import {
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
} from "../components/common/Skeleton";
import {
  fetchDashboardStats,
  fetchRevenueAnalytics,
  fetchCustomerDistribution,
  fetchTopModels,
  fetchStateDistribution,
  fetchServiceStats,
  fetchRecentLeads,
} from "../redux/slices/dashboardSlice";
import { getChartTheme } from "../utils/themeUtils";

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const [periodFilter, setPeriodFilter] = useState("12m");

  const {
    loading,
    error,
    dashboardStats,
    dashboardAnalytics,
    revenueAnalytics,
    customerDistribution,
    topModels,
    serviceStats,
    stateDistribution,
    recentLeads,
  } = useSelector((state) => state.dashboard);

  const { mode: theme } = useSelector((state) => state.theme);
  const chartTheme = getChartTheme(theme);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRevenueAnalytics(periodFilter));
    dispatch(fetchCustomerDistribution());
    dispatch(fetchTopModels());
    dispatch(fetchServiceStats());
    dispatch(fetchStateDistribution());
    dispatch(fetchRecentLeads());
  }, [dispatch, periodFilter]);

  const stats = dashboardStats || {};

  // 📊 Chart Data with Theme-Aware Colors
  const revenueChartData = {
    labels: revenueAnalytics?.months || [],
    datasets: [
      {
        label: "Customers",
        data: revenueAnalytics?.counts || [],
        borderColor: chartTheme.primaryColor,
        backgroundColor: chartTheme.primaryColor + "20",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const rolePerformanceChartData = {
    labels: stats.rolePerformance?.map((r) => r.name) || [],
    datasets: [
      {
        label: "Users in status",
        data: stats.rolePerformance?.map((r) => r.userCount) || [],
        backgroundColor: chartTheme.primaryColor + "a8",
        borderColor: chartTheme.primaryColor,
        borderWidth: 1,
      },
    ],
  };

  // Chart Options - Theme Aware
  const chartOptions = {
    ...chartTheme.defaultOptions,
    responsive: true,
    plugins: {
      ...chartTheme.defaultOptions.plugins,
      legend: { 
        ...chartTheme.defaultOptions.plugins.legend,
        position: "bottom" 
      },
    },
  };

  const rolePerformanceOptions = {
    ...chartTheme.defaultOptions,
    responsive: true,
    plugins: {
      ...chartTheme.defaultOptions.plugins,
      legend: { display: false },
      title: {
        display: true,
        text: "Role Performance: Users per Role Status",
        color: chartTheme.textColor,
        font: { size: 16 },
      },
    },
    scales: {
      ...chartTheme.defaultOptions.scales,
      y: {
        ...chartTheme.defaultOptions.scales.y,
        beginAtZero: true,
        ticks: {
          ...chartTheme.defaultOptions.scales.y.ticks,
          stepSize: 1,
        },
      },
    },
  };

  const funnelOptions = {
    ...chartTheme.defaultOptions,
    responsive: true,
    plugins: {
      ...chartTheme.defaultOptions.plugins,
      legend: { 
        ...chartTheme.defaultOptions.plugins.legend,
        position: "bottom" 
      },
    },
    scales: {
      ...chartTheme.defaultOptions.scales,
      y: {
        ...chartTheme.defaultOptions.scales.y,
        beginAtZero: true,
      },
    },
  };

  // ⏳ Loading (Skeleton)
  if (loading) {
    return (
      <div className="dashboard">
        <div className="skeleton-global-container">
          <CardSkeleton count={5} />
          <ChartSkeleton />
          <div className="chart-row">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={6} cols={5} />
        </div>
      </div>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <p className="error-msg">{error}</p>
          <button
            className="btn-primary"
            onClick={() => {
              dispatch(fetchDashboardStats());
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <motion.div
        className="dash-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2>Dashboard</h2>
          <p className="subtitle">Overview of your business metrics</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          margin: "15px 0px",
          flexWrap: "wrap",
          cursor: "pointer",
        }}
      >
        <motion.div
          className="stat-card customers"
          whileHover={{ scale: 1.05 }}
        >
          <FaUsers className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Total Customers</p>
            <h3>{stats.customers?.totalCustomers || 0}</h3>
            <p className="stat-subtext">
              +{stats.customers?.newCustomers7d || 0} this week
            </p>
          </div>
        </motion.div>

        <motion.div className="stat-card users" whileHover={{ scale: 1.05 }}>
          <FaUserCheck className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Active Users</p>
            <h3>{stats.users?.activeUsers || 0}</h3>
            <p className="stat-subtext">
              +{stats.users?.newUsersLast7 || 0} new
            </p>
          </div>
        </motion.div>

        <motion.div className="stat-card models" whileHover={{ scale: 1.05 }}>
          <FaChartLine className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Converted</p>
            <h3>{stats.customers?.converted || 0}</h3>
            <p className="stat-subtext">
              Pending: {stats.customers?.pending || 0}
            </p>
          </div>
        </motion.div>

        <motion.div className="stat-card services" whileHover={{ scale: 1.05 }}>
          <FaPercent className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Conversion Rate</p>
            <h3>
              {stats.customers?.totalCustomers
                ? (
                    (stats.customers.converted /
                      stats.customers.totalCustomers) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </h3>
            <p className="stat-subtext">From total leads</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        className="dashboard-controls"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span>Time range:</span>
        {[
          ["1m", "1M"],
          ["3m", "3M"],
          ["6m", "6M"],
          ["12m", "12M"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`range-btn ${periodFilter === key ? "active" : ""}`}
            onClick={() => setPeriodFilter(key)}
          >
            {label}
          </button>
        ))}
      </motion.div>

      <motion.div
        className="chart-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3>Customer Analytics</h3>
        {revenueAnalytics?.months?.length ? (
          <Line data={revenueChartData} />
        ) : (
          <p>No data available</p>
        )}
      </motion.div>

      {/* Doughnut Charts */}
      <div className="chart-row">
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3>Customer Distribution</h3>
          {customerDistribution ? (
            <Doughnut data={customerDistribution} options={chartOptions} />
          ) : (
            <p>No data</p>
          )}
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3>State Distribution</h3>
          {stateDistribution ? (
            <Doughnut data={stateDistribution} options={chartOptions} />
          ) : (
            <p>No data</p>
          )}
        </motion.div>
      </div>

      {/* Top Models */}
      <div className="top-products">
        <h3>Top Products</h3>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Customers</th>
            </tr>
          </thead>

          <tbody>
            {topModels?.length > 0 ? (
              topModels?.map((m, i) => (
                <tr key={i}>
                  <td>{m.modelName}</td>
                  <td>{m.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Service Category Performance */}
      <motion.div
        className="top-products"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3>Service category usage</h3>

        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Requests</th>
            </tr>
          </thead>

          <tbody>
            {serviceStats?.length > 0 ? (
              serviceStats.map((s, i) => (
                <tr key={i}>
                  <td>{s.categoryName}</td>
                  <td>{s.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Role Performance */}
      <motion.div
        className="top-products"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3>Role Performance</h3>

        {/* Role performance bar chart */}
        {stats.rolePerformance?.length > 0 ? (
          <div
            className="chart-card"
            style={{ padding: "16px", marginBottom: "24px" }}
          >
            <Bar
              data={rolePerformanceChartData}
              options={rolePerformanceOptions}
            />
          </div>
        ) : (
          <p>No role performance data</p>
        )}

        <table>
          <thead>
            <tr>
              <th>Role Status</th>
              <th>User Role</th>
              <th>User Count</th>
            </tr>
          </thead>

          <tbody>
            {stats.rolePerformance?.length > 0 ? (
              stats.rolePerformance.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.userRole?.name || "N/A"}</td>
                  <td>{r.userCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Recent Leads */}
      <div className="top-products">
        <h3>Latest Leads</h3>

        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Model</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {recentLeads?.length > 0 ? (
              recentLeads.map((lead, i) => (
                <tr key={i}>
                  <td>{lead.name}</td>
                  <td>{lead.model}</td>
                  <td>{lead.category}</td>
                  <td
                    className={`status-badge ${lead.status?.toLowerCase() || "unknown"}`}
                  >
                    {lead.status || '-'}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        lead.assignedStatus?.toLowerCase() || "unknown"
                      }`}
                    >
                      {lead.assignedStatus || '-'}
                    </span>
                  </td>
                  <td>{new Date(lead.received).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No recent leads</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
