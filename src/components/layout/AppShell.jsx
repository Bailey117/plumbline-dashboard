import React, { useState, useEffect } from 'react';
import Header from './Header';
import AlertsPanel from './AlertsPanel';
import SearchPalette from './SearchPalette';
import { useAlerts } from '../../api/hooks';

export default function AppShell({ children }) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { alerts } = useAlerts();

  const alertCount = alerts.filter(a => a.sev === "warn" || a.sev === "alert").length;

  // Global ⌘K shortcut
  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
      fontSize: "var(--fs, 13px)",
      overflow: "hidden",
    }}>
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onAlertsOpen={() => setAlertsOpen(true)}
        alertCount={alertCount}
      />

      <main style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {children}
      </main>

      <AlertsPanel
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
      />

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
