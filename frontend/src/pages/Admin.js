import React, { useState, useEffect } from "react";
import "../styles/Admin.css";
import CommunityRequests from "../components/Admin/CommunityRequests";
import UserManagement from "../components/Admin/UserManagement";
import PlatformActivity from "../components/Admin/PlatformActivity";
import AbuseReports from "../components/Admin/AbuseReports";
import ContentManagement from "../components/Admin/ContentManagement";

function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("community-requests");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !userData) {
      window.location.href = "/login";
      return;
    }

    // Check if user has admin role
    if (userData.role !== "admin") {
      window.location.href = "/";
      return;
    }

    setUser(userData);
  }, []);

  if (!user) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Platform Admin Dashboard</h1>
        <p>Welcome, {user.name}</p>
      </header>

      <div className="admin-content">
        <nav className="admin-sidebar">
          <h3>Admin Menu</h3>
          <button
            className={`nav-button ${activeTab === "community-requests" ? "active" : ""}`}
            onClick={() => setActiveTab("community-requests")}
          >
            📋 Community Requests
          </button>
          <button
            className={`nav-button ${activeTab === "user-management" ? "active" : ""}`}
            onClick={() => setActiveTab("user-management")}
          >
            👥 Manage Users & Moderators
          </button>
          <button
            className={`nav-button ${activeTab === "platform-activity" ? "active" : ""}`}
            onClick={() => setActiveTab("platform-activity")}
          >
            📊 Platform Activity
          </button>
          <button
            className={`nav-button ${activeTab === "abuse-reports" ? "active" : ""}`}
            onClick={() => setActiveTab("abuse-reports")}
          >
            🚩 Abuse Reports & Disputes
          </button>
          <button
            className={`nav-button ${activeTab === "content-management" ? "active" : ""}`}
            onClick={() => setActiveTab("content-management")}
          >
            🏷️ Content Categories & Tags
          </button>
          <button className="nav-button logout-btn" onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}>
            🚪 Logout
          </button>
        </nav>

        <main className="admin-main">
          {activeTab === "community-requests" && <CommunityRequests />}
          {activeTab === "user-management" && <UserManagement />}
          {activeTab === "platform-activity" && <PlatformActivity />}
          {activeTab === "abuse-reports" && <AbuseReports />}
          {activeTab === "content-management" && <ContentManagement />}
        </main>
      </div>
    </div>
  );
}

export default Admin;