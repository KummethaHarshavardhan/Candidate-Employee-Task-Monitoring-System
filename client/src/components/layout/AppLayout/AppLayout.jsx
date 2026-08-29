import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Topbar } from '../Topbar/Topbar';
import './AppLayout.css';

export const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDesktopOpen={isDesktopOpen}
        setIsDesktopOpen={setIsDesktopOpen}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar
          onToggleMobileSidebar={() => {
            setIsMobileOpen(!isMobileOpen);
            setIsDesktopOpen(!isDesktopOpen);
          }}
        />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
