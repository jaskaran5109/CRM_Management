// Theme Color Configuration
export const THEME_COLORS = {
  light: {
    // Primary colors
    primary: "#2563eb",
    secondary: "#7c3aed",
    accent: "#aa3bff",
    accentBg: "rgba(170, 59, 255, 0.1)",
    accentBorder: "rgba(170, 59, 255, 0.5)",

    // Background colors
    bg: "#ffffff",
    bgSecondary: "#f8f9fa",
    bgTertiary: "#f3f4f6",

    // Text colors
    text: "#1f2937",
    textSecondary: "#6b6375",
    textMuted: "#888888",
    textPlaceholder: "#9ca3af",

    // Border colors
    border: "#e5e7eb",
    borderLight: "#f3f4f6",

    // Component colors
    sidebar: "#f9fafb",
    sidebarText: "#374151",
    sidebarTextActive: "#ffffff",
    sidebarBg: "#1f2937",
    sidebarHover: "#374151",

    // Card and surface colors
    card: "#ffffff",
    cardBorder: "rgba(15, 23, 42, 0.06)",
    shadow: "rgba(0, 0, 0, 0.1)",
    shadowHeavy: "rgba(15, 23, 42, 0.12)",

    // Status colors
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",

    // Modal and overlay
    overlay: "rgba(17, 24, 39, 0.6)",
    modal: "#ffffff",

    // Chart colors
    gridLine: "#e5e7eb",
    chartBackground: "transparent",
    chartText: "#1f2937",
    chartTooltipBg: "#ffffff",
    chartTooltipBorder: "#e5e7eb",
  },

  dark: {
    // Primary colors
    primary: "#60a5fa",
    secondary: "#a78bfa",
    accent: "#c084fc",
    accentBg: "rgba(192, 132, 252, 0.15)",
    accentBorder: "rgba(192, 132, 252, 0.5)",

    // Background colors
    bg: "#111827",
    bgSecondary: "#1f2937",
    bgTertiary: "#374151",

    // Text colors
    text: "#f9fafb",
    textSecondary: "#e5e7eb",
    textMuted: "#9ca3af",
    textPlaceholder: "#6b7280",

    // Border colors
    border: "#374151",
    borderLight: "#1f2937",

    // Component colors
    sidebar: "#1f2937",
    sidebarText: "#d1d5db",
    sidebarTextActive: "#ffffff",
    sidebarBg: "#111827",
    sidebarHover: "#374151",

    // Card and surface colors
    card: "#1f2937",
    cardBorder: "rgba(255, 255, 255, 0.06)",
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowHeavy: "rgba(0, 0, 0, 0.4)",

    // Status colors
    success: "#34d399",
    error: "#f87171",
    warning: "#fbbf24",
    info: "#60a5fa",

    // Modal and overlay
    overlay: "rgba(0, 0, 0, 0.7)",
    modal: "#1f2937",

    // Chart colors
    gridLine: "#4b5563",
    chartBackground: "transparent",
    chartText: "#f9fafb",
    chartTooltipBg: "#1f2937",
    chartTooltipBorder: "#374151",
  },
};

// Get colors for current theme
export const getThemeColors = (theme) => THEME_COLORS[theme] || THEME_COLORS.light;

// Chart Theme Configuration
export const getChartTheme = (theme) => {
  const colors = getThemeColors(theme);

  return {
    textColor: colors.chartText,
    gridColor: colors.gridLine,
    backgroundColor: colors.chartBackground,
    tooltipBg: colors.chartTooltipBg,
    tooltipBorder: colors.chartTooltipBorder,
    tooltipTextColor: colors.text,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,

    defaultOptions: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: colors.chartText,
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: 500,
            },
          },
        },
        tooltip: {
          backgroundColor: colors.chartTooltipBg,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.chartTooltipBorder,
          borderWidth: 1,
          padding: 12,
          titleFont: {
            size: 13,
            weight: 600,
          },
          bodyFont: {
            size: 12,
          },
          usePointStyle: true,
        },
        filler: {
          propagate: true,
        },
      },
      scales: {
        x: {
          grid: {
            color: colors.gridLine,
            drawBorder: false,
          },
          ticks: {
            color: colors.textMuted,
            font: {
              size: 11,
            },
          },
        },
        y: {
          grid: {
            color: colors.gridLine,
            drawBorder: false,
          },
          ticks: {
            color: colors.textMuted,
            font: {
              size: 11,
            },
          },
        },
      },
    },
  };
};

// Apply theme to document
export const applyTheme = (theme) => {
  const htmlElement = document.documentElement;
  htmlElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

// Get theme from document
export const getDocumentTheme = () => {
  return document.documentElement.getAttribute("data-theme") || "light";
};
