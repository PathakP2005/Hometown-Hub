import React, { useState, useEffect } from "react";

function AbuseReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    // Load abuse reports from localStorage
    const storedReports = JSON.parse(
      localStorage.getItem("abuseReports") || "[]"
    );
    setReports(storedReports);
  }, []);

  const handleResolveReport = (reportId, resolution) => {
    const updatedReports = reports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: "resolved",
            resolution,
            resolvedAt: new Date().toISOString(),
          }
        : report
    );
    setReports(updatedReports);
    localStorage.setItem("abuseReports", JSON.stringify(updatedReports));
    alert("Report resolved!");
  };

  const handleDismissReport = (reportId) => {
    const updatedReports = reports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: "dismissed",
            dismissedAt: new Date().toISOString(),
          }
        : report
    );
    setReports(updatedReports);
    localStorage.setItem("abuseReports", JSON.stringify(updatedReports));
    alert("Report dismissed!");
  };

  const filteredReports = reports.filter((report) => report.status === filter);

  return (
    <div className="admin-section">
      <h2>🚩 Abuse Reports & Disputes</h2>

      <div className="filter-buttons">
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pending ({reports.filter((r) => r.status === "pending").length})
        </button>
        <button
          className={filter === "resolved" ? "active" : ""}
          onClick={() => setFilter("resolved")}
        >
          Resolved
        </button>
        <button
          className={filter === "dismissed" ? "active" : ""}
          onClick={() => setFilter("dismissed")}
        >
          Dismissed
        </button>
      </div>

      <div className="reports-list">
        {filteredReports.length === 0 ? (
          <p className="empty-state">No {filter} reports found.</p>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <h3>Report #{report.id}</h3>
                <span className={`status-badge ${report.status}`}>
                  {report.status.toUpperCase()}
                </span>
              </div>
              <p>
                <strong>Type:</strong> {report.type}
              </p>
              <p>
                <strong>Reported By:</strong> {report.reportedBy}
              </p>
              <p>
                <strong>Reported User/Content:</strong> {report.reportedContent}
              </p>
              <p>
                <strong>Reason:</strong> {report.reason}
              </p>
              <p>
                <strong>Description:</strong> {report.description}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(report.createdAt).toLocaleString()}
              </p>

              {report.status === "pending" && (
                <div className="report-actions">
                  <button
                    className="btn-sm btn-approve"
                    onClick={() =>
                      handleResolveReport(report.id, "Content removed")
                    }
                  >
                    ✓ Remove Content
                  </button>
                  <button
                    className="btn-sm btn-suspend"
                    onClick={() =>
                      handleResolveReport(report.id, "User suspended")
                    }
                  >
                    🚫 Suspend User
                  </button>
                  <button
                    className="btn-sm btn-reject"
                    onClick={() => handleDismissReport(report.id)}
                  >
                    ✗ Dismiss
                  </button>
                </div>
              )}

              {report.status === "resolved" && (
                <p className="resolution-text">
                  <strong>Resolution:</strong> {report.resolution}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AbuseReports;
