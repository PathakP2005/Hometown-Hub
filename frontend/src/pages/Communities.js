import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {  Grid, TextField, Button, Typography, Select, MenuItem, FormControl, InputLabel, Alert, Checkbox, FormControlLabel } from "@mui/material";

const API_BASE = "http://localhost:5000/api";

function Communities() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("City");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Admin state
  const [memberRequests, setMemberRequests] = useState([]);
  const [rules, setRules] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleContent, setNewRuleContent] = useState("");
  const [editingRule, setEditingRule] = useState(null);

  const getToken = useCallback(() => localStorage.getItem("token"), []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const normalize = (community) => ({ ...community, id: community._id || community.id });

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/auth/profile`, {
        headers: getAuthHeaders(),
      });
      const fetchedUser = res.data.user;
      setUser(fetchedUser);
      localStorage.setItem("user", JSON.stringify(fetchedUser));
    } catch (error) {
      console.error("Profile load error:", error);
      navigate("/login");
    }
  }, [getToken, navigate]);

  const fetchCommunities = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/communities`, {
        headers: getAuthHeaders(),
      });
      setCommunities(res.data.communities.map(normalize));
    } catch (error) {
      console.error("Communities load error:", error);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchCommunities()]);
      setLoading(false);
    };

    load();
  }, [fetchCommunities, fetchProfile, getToken, navigate]);

  const saveUser = useCallback((updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const joinedCommunityIds = useMemo(
    () => new Set((user?.joinedCommunities || []).map((item) => item._id || item)),
    [user]
  );

  const filteredCommunities = useMemo(
    () => communities.filter((community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (community.city && community.city.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [communities, searchTerm]
  );

  const createCommunity = async () => {
    if (!name.trim() || !city.trim() || !location.trim()) {
      setSubmissionMessage("Please enter a community name, city, and location.");
      return;
    }

    try {
      setSubmissionMessage("");
      const res = await axios.post(
        `${API_BASE}/communities`,
        { name: name.trim(), type, city: city.trim(), location: location.trim(), description: description.trim(), requireApproval },
        { headers: getAuthHeaders() }
      );

      const message = res.data.message || "Community creation request submitted successfully. Waiting for admin approval.";
      setSubmissionMessage(message);
      setName("");
      setCity("");
      setLocation("");
      setDescription("");
      setRequireApproval(false);
    } catch (error) {
      console.error("Create community request error:", error);
      const message = error.response?.data?.message || "Unable to submit community creation request.";
      setSubmissionMessage(message);
    }
  };

  const joinCommunity = async (communityId) => {
    if (!user) return;

    try {
      const res = await axios.post(
        `${API_BASE}/communities/${communityId}/join`,
        {},
        { headers: getAuthHeaders() }
      );

      if (res.data.message) {
        alert(res.data.message);
        return;
      }

      const updatedCommunity = normalize(res.data.community);
      setCommunities((prev) => prev.map((community) =>
        community.id === communityId ? updatedCommunity : community
      ));

      saveUser(res.data.user);
      alert("You joined the community successfully.");
    } catch (error) {
      console.error("Join community error:", error);
      alert(error.response?.data?.message || "Unable to join community.");
    }
  };

  // Admin functions
  const openAdminPanel = (community) => {
    setSelectedCommunity(community);
    setMemberRequests(community.memberRequests || []);
    setRules(community.rules || []);
    setModerators(community.moderators || []);
    setShowAdminPanel(true);
    setActiveTab("overview");
  };

  const closeAdminPanel = () => {
    setShowAdminPanel(false);
    setSelectedCommunity(null);
    setMemberRequests([]);
    setRules([]);
    setModerators([]);
    setNewRuleTitle("");
    setNewRuleContent("");
    setEditingRule(null);
  };

  const approveMemberRequest = async (requestUserId, action) => {
    try {
      const res = await axios.post(
        `${API_BASE}/communities/${selectedCommunity.id}/members/${requestUserId}/${action}`,
        {},
        { headers: getAuthHeaders() }
      );

      // Update local state
      setMemberRequests(prev => prev.map(req =>
        req.userId === requestUserId
          ? { ...req, status: action === "approve" ? "approved" : "rejected" }
          : req
      ));

      // Update community in list
      setCommunities(prev => prev.map(community =>
        community.id === selectedCommunity.id ? res.data.community : community
      ));

      alert(`Member request ${action}d successfully.`);
    } catch (error) {
      console.error("Member approval error:", error);
      alert(error.response?.data?.message || "Unable to process request.");
    }
  };

  const addRule = async () => {
    if (!newRuleTitle.trim() || !newRuleContent.trim()) {
      alert("Please enter both title and content for the rule.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/communities/${selectedCommunity.id}/rules`,
        { title: newRuleTitle.trim(), content: newRuleContent.trim() },
        { headers: getAuthHeaders() }
      );

      setRules(res.data.community.rules);
      setNewRuleTitle("");
      setNewRuleContent("");
      alert("Rule added successfully.");
    } catch (error) {
      console.error("Add rule error:", error);
      alert(error.response?.data?.message || "Unable to add rule.");
    }
  };

  const updateRule = async (ruleId) => {
    if (!newRuleTitle.trim() || !newRuleContent.trim()) {
      alert("Please enter both title and content for the rule.");
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE}/communities/${selectedCommunity.id}/rules/${ruleId}`,
        { title: newRuleTitle.trim(), content: newRuleContent.trim() },
        { headers: getAuthHeaders() }
      );

      setRules(res.data.community.rules);
      setNewRuleTitle("");
      setNewRuleContent("");
      setEditingRule(null);
      alert("Rule updated successfully.");
    } catch (error) {
      console.error("Update rule error:", error);
      alert(error.response?.data?.message || "Unable to update rule.");
    }
  };

  const deleteRule = async (ruleId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/communities/${selectedCommunity.id}/rules/${ruleId}`,
        { headers: getAuthHeaders() }
      );

      setRules(res.data.community.rules);
      alert("Rule deleted successfully.");
    } catch (error) {
      console.error("Delete rule error:", error);
      alert(error.response?.data?.message || "Unable to delete rule.");
    }
  };

  const startEditRule = (rule) => {
    setEditingRule(rule._id);
    setNewRuleTitle(rule.title);
    setNewRuleContent(rule.content);
  };

  const cancelEditRule = () => {
    setEditingRule(null);
    setNewRuleTitle("");
    setNewRuleContent("");
  };

  const isUserAdmin = (community) => {
    if (!user) return false;

    const creatorId = community.creator?._id || community.creator;
    const moderatorIds = (community.moderators || []).map((mod) => mod?._id || mod);

    return creatorId === user._id || moderatorIds.includes(user._id);
  };

  const userCommunities = useMemo(
    () => communities.filter((community) => joinedCommunityIds.has(community._id || community.id)),
    [communities, joinedCommunityIds]
  );

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 10px 0" }}>City / Village Communities</h1>
          <p style={{ margin: 0, color: "#555" }}>Create or join a community group for your hometown.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}
          >
            Back to Home
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid #007bff", background: "#007bff", color: "white", cursor: "pointer" }}
          >
            Profile
          </button>
          {user?.role === "admin" && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid #1d4ed8", background: "#1d4ed8", color: "white", cursor: "pointer" }}
            >
              Admin Dashboard
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "20px" }}>
        <div>
          <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px", background: "white", marginBottom: "20px" }}>
            <Typography variant="h6" gutterBottom>Create a community</Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>Start a new city or village community and automatically join it.</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Community name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="City">City</MenuItem>
                    <MenuItem value="Village">Village</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location (e.g. Springfield, Smallville)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                    />
                  }
                  label="Require approval for new members"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={createCommunity}
                  fullWidth
                >
                  Create Community
                </Button>
              </Grid>
            </Grid>
            {submissionMessage && (
              <Alert severity="info" style={{ marginTop: 16 }}>
                {submissionMessage}
              </Alert>
            )}
          </div>

          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search communities by name or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
            />
          </div>

          {filteredCommunities.length === 0 ? (
            <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "8px", color: "#666" }}>
              No communities found yet. Create the first city or village group.
            </div>
          ) : (
            filteredCommunities.map((community) => {
              const joined = joinedCommunityIds.has(community._id || community.id);
              return (
                <div key={community.id} style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "18px", background: "white", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px 0" }}>{community.name}</h3>
                      <p style={{ margin: "0 0 8px 0", color: "#555", fontSize: "14px" }}><strong>{community.type}</strong> • {community.location}</p>
                    </div>
                    <span style={{ padding: "6px 10px", borderRadius: "999px", background: joined ? "#e6f4ea" : "#eef2ff", color: joined ? "#1f7a32" : "#2a4db8", fontSize: "13px" }}>
                      {joined ? "Joined" : "Open"}
                    </span>
                  </div>
                  {community.description && <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>{community.description}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", gap: "10px", flexWrap: "wrap" }}>
                    <p style={{ margin: 0, color: "#666", fontSize: "13px" }}>{community.members.length} members</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {isUserAdmin(community) && (
                        <button
                          type="button"
                          onClick={() => openAdminPanel(community)}
                          style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #28a745", background: "#28a745", color: "white", cursor: "pointer", fontSize: "12px" }}
                        >
                          Admin Panel
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={joined}
                        onClick={() => joinCommunity(community.id)}
                        style={{ padding: "8px 12px", borderRadius: "4px", border: "none", background: joined ? "#ccc" : "#007bff", color: "white", cursor: joined ? "default" : "pointer", fontSize: "12px" }}
                      >
                        {joined ? "Already joined" : "Join community"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <aside style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "20px", background: "white" }}>
          <h2 style={{ margin: "0 0 14px 0" }}>Your communities</h2>
          {userCommunities.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>You are not a member of any communities yet.</p>
          ) : (
            userCommunities.map((community) => (
              <div key={community.id} style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{community.name}</p>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{community.type} • {community.location}</p>
              </div>
            ))
          )}
          <div style={{ marginTop: "24px", padding: "16px", background: "#f6f8fa", borderRadius: "10px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Quick tip</h3>
            <p style={{ margin: 0, color: "#555", fontSize: "14px" }}>
              Communities help neighbors share updates, events, and local support in one place.
            </p>
          </div>
        </aside>
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && selectedCommunity && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          }}>
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ margin: 0 }}>Admin Panel - {selectedCommunity.name}</h2>
              <button
                onClick={closeAdminPanel}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {/* Tab Navigation */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd" }}>
                {["overview", "members", "rules", "moderators"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      background: activeTab === tab ? "#007bff" : "#f8f9fa",
                      color: activeTab === tab ? "white" : "#666",
                      borderRadius: "6px 6px 0 0",
                      cursor: "pointer",
                      fontWeight: activeTab === tab ? "bold" : "normal"
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div>
                  <h3>Community Overview</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <h4 style={{ margin: "0 0 10px 0" }}>Members</h4>
                      <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{selectedCommunity.members?.length || 0}</p>
                    </div>
                    <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
                      <h4 style={{ margin: "0 0 10px 0" }}>Pending Requests</h4>
                      <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{memberRequests.filter(r => r.status === "pending").length}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div>
                  <h3>Member Requests</h3>
                  {memberRequests.filter(r => r.status === "pending").length === 0 ? (
                    <p>No pending member requests.</p>
                  ) : (
                    memberRequests.filter(r => r.status === "pending").map(request => (
                      <div key={request._id} style={{
                        padding: "16px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        marginBottom: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        flexWrap: "wrap"
                      }}>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>User ID: {request.userId}</p>
                          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => approveMemberRequest(request.userId, "approve")}
                            style={{
                              padding: "8px 12px",
                              background: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              flex: "0 1 auto",
                              minWidth: "80px"
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => approveMemberRequest(request.userId, "reject")}
                            style={{
                              padding: "8px 12px",
                              background: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              flex: "0 1 auto",
                              minWidth: "80px"
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "rules" && (
                <div>
                  <h3>Community Rules</h3>

                  {/* Add/Edit Rule Form */}
                  <div style={{ marginBottom: "20px", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
                    <h4>{editingRule ? "Edit Rule" : "Add New Rule"}</h4>
                    <input
                      type="text"
                      placeholder="Rule title"
                      value={newRuleTitle}
                      onChange={(e) => setNewRuleTitle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px"
                      }}
                    />
                    <textarea
                      placeholder="Rule content"
                      value={newRuleContent}
                      onChange={(e) => setNewRuleContent(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        resize: "vertical"
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={editingRule ? () => updateRule(editingRule) : addRule}
                        style={{
                          padding: "8px 16px",
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        {editingRule ? "Update Rule" : "Add Rule"}
                      </button>
                      {editingRule && (
                        <button
                          onClick={cancelEditRule}
                          style={{
                            padding: "8px 16px",
                            background: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rules List */}
                  {rules.length === 0 ? (
                    <p>No rules defined yet.</p>
                  ) : (
                    rules.map(rule => (
                      <div key={rule._id} style={{
                        padding: "16px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        marginBottom: "12px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "0 0 8px 0" }}>{rule.title}</h4>
                            <p style={{ margin: 0, color: "#666" }}>{rule.content}</p>
                            <small style={{ color: "#999" }}>
                              Created: {new Date(rule.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                            <button
                              onClick={() => startEditRule(rule)}
                              style={{
                                padding: "4px 8px",
                                background: "#ffc107",
                                color: "black",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteRule(rule._id)}
                              style={{
                                padding: "4px 8px",
                                background: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "moderators" && (
                <div>
                  <h3>Community Moderators</h3>
                  <p style={{ marginBottom: "16px", color: "#666" }}>
                    Moderators can approve member requests, moderate posts, and manage rules.
                  </p>
                  {moderators.length === 0 ? (
                    <p>No moderators assigned yet.</p>
                  ) : (
                    moderators.map(moderator => (
                      <div key={moderator._id} style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>{moderator.name}</span>
                        <span style={{ color: "#666", fontSize: "14px" }}>Moderator</span>
                      </div>
                    ))
                  )}
                  <p style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
                    To assign new moderators, contact the community creator.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Communities;
