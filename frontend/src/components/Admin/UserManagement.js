import React, { useState, useEffect } from "react";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Load users from localStorage
    const storedUsers = JSON.parse(
      localStorage.getItem("hometownHubUsers") || "[]"
    );
    setUsers(storedUsers);
  }, []);

  const handlePromoteToModerator = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, role: "moderator" } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem("hometownHubUsers", JSON.stringify(updatedUsers));
    alert("User promoted to moderator!");
  };

  const handleDemoteFromModerator = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, role: "user" } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem("hometownHubUsers", JSON.stringify(updatedUsers));
    alert("User demoted from moderator!");
  };

  const handleSuspendUser = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, status: "suspended" } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem("hometownHubUsers", JSON.stringify(updatedUsers));
    alert("User suspended!");
  };

  const handleActivateUser = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, status: "active" } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem("hometownHubUsers", JSON.stringify(updatedUsers));
    alert("User activated!");
  };

  const filteredUsers =
    filter === "all"
      ? users
      : filter === "moderators"
      ? users.filter((u) => u.role === "moderator")
      : users.filter((u) => u.status === "suspended");

  return (
    <div className="admin-section">
      <h2>👥 Manage Users & Moderators</h2>

      <div className="filter-buttons">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All Users ({users.length})
        </button>
        <button
          className={filter === "moderators" ? "active" : ""}
          onClick={() => setFilter("moderators")}
        >
          Moderators ({users.filter((u) => u.role === "moderator").length})
        </button>
        <button
          className={filter === "suspended" ? "active" : ""}
          onClick={() => setFilter("suspended")}
        >
          Suspended ({users.filter((u) => u.status === "suspended").length})
        </button>
      </div>

      <div className="users-table">
        {filteredUsers.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="action-buttons">
                    {user.role === "user" && (
                      <button
                        className="btn-sm btn-promote"
                        onClick={() => handlePromoteToModerator(user.id)}
                        title="Promote to Moderator"
                      >
                        ⬆️ Moderator
                      </button>
                    )}
                    {user.role === "moderator" && (
                      <button
                        className="btn-sm btn-demote"
                        onClick={() => handleDemoteFromModerator(user.id)}
                        title="Demote from Moderator"
                      >
                        ⬇️ User
                      </button>
                    )}
                    {user.status === "active" && (
                      <button
                        className="btn-sm btn-suspend"
                        onClick={() => handleSuspendUser(user.id)}
                        title="Suspend User"
                      >
                        🚫 Suspend
                      </button>
                    )}
                    {user.status === "suspended" && (
                      <button
                        className="btn-sm btn-activate"
                        onClick={() => handleActivateUser(user.id)}
                        title="Activate User"
                      >
                        ✓ Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
