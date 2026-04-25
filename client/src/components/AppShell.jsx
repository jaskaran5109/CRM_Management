import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./AppShell.css";

const SIDEBAR_STATE_KEY = "crm-sidebar-collapsed";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_STATE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="crm-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div
        className={`crm-shell__main ${
          sidebarCollapsed
            ? "crm-shell__main--sidebar-collapsed"
            : "crm-shell__main--sidebar-expanded"
        }`}
      >
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="crm-shell__content">{children}</main>
      </div>
    </div>
  );
}
