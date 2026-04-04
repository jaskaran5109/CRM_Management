import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="app-shell-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
}