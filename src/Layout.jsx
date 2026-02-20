import React from "react";
import Sidebar from "./components/layout/Sidebar";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-[var(--modal-bg)]">
      <Sidebar currentPage={currentPageName} />
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}