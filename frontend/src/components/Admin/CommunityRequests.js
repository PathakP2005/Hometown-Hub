import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

function CommunityRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/communities/creation-requests`, {
        headers: getAuthHeaders(),
      });
      setRequests(res.data.requests);
    } catch (error) {
      console.error("Fetch requests error:", error);
      alert("Unable to load community creation requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/communities/creation-requests/${requestId}/approve`,
        {},
        { headers: getAuthHeaders() }
      );

      // Update local state
      setRequests(prev => prev.map(req =>
        req._id === requestId ? { ...req, status: "approved", reviewedAt: new Date(), reviewedBy: { name: "Admin" } } : req
      ));

      alert(res.data.message || "Community creation request approved!");
    } catch (error) {
      console.error("Approve request error:", error);
      alert(error.response?.data?.message || "Unable to approve request.");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/communities/creation-requests/${requestId}/reject`,
        {},
        { headers: getAuthHeaders() }
      );

      // Update local state
      setRequests(prev => prev.map(req =>
        req._id === requestId ? { ...req, status: "rejected", reviewedAt: new Date(), reviewedBy: { name: "Admin" } } : req
      ));

      alert(res.data.message || "Community creation request rejected!");
    } catch (error) {
      console.error("Reject request error:", error);
      alert(error.response?.data?.message || "Unable to reject request.");
    }
  };

  const filteredRequests = requests.filter((req) => req.status === filter);

  return (
    <div className="admin-section">
      <h2>📋 Community Creation Requests</h2>

      <div className="filter-buttons">
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pending ({requests.filter((r) => r.status === "pending").length})
        </button>
        <button
          className={filter === "approved" ? "active" : ""}
          onClick={() => setFilter("approved")}
        >
          Approved
        </button>
        <button
          className={filter === "rejected" ? "active" : ""}
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </button>
      </div>

      <div className="requests-list">
        {loading ? (
          <p>Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="empty-state">No {filter} requests found.</p>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <h3>{request.name}</h3>
                <span className={`status-badge ${request.status}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
              <p>
                <strong>Type:</strong> {request.type}
              </p>
              <p>
                <strong>Location:</strong> {request.location}
              </p>
              {request.description && (
                <p>
                  <strong>Description:</strong> {request.description}
                </p>
              )}
              <p>
                <strong>Require Approval:</strong> {request.requireApproval ? "Yes" : "No"}
              </p>
              <p>
                <strong>Requested By:</strong> {request.requestedBy?.name || "Unknown"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
              {request.status !== "pending" && request.reviewedAt && (
                <p>
                  <strong>Reviewed:</strong>{" "}
                  {new Date(request.reviewedAt).toLocaleDateString()} by {request.reviewedBy?.name || "Admin"}
                </p>
              )}

              {request.status === "pending" && (
                <div className="request-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(request._id)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(request._id)}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommunityRequests;
