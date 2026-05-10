import React, { useState, useEffect } from "react";

function PlatformActivity() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCommunities: 0,
    totalPosts: 0,
    totalEvents: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Load statistics from localStorage
    const users = JSON.parse(
      localStorage.getItem("hometownHubUsers") || "[]"
    );
    const communities = JSON.parse(
      localStorage.getItem("hometownHubCommunities") || "[]"
    );
    const posts = JSON.parse(
      localStorage.getItem("hometownHubPosts") || "[]"
    );
    const events = JSON.parse(
      localStorage.getItem("hometownHubEvents") || "[]"
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newUsersThisMonth = users.filter((user) => {
      const userDate = new Date(user.createdAt || Date.now());
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    setStats({
      totalUsers: users.length,
      totalCommunities: communities.length,
      totalPosts: posts.length,
      totalEvents: events.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      newUsersThisMonth,
    });

    // Create activity log
    const activities = [
      ...posts.map((post) => ({
        type: "post",
        description: `New post created`,
        author: post.author,
        date: post.createdAt,
      })),
      ...events.map((event) => ({
        type: "event",
        description: `New event: ${event.title}`,
        author: event.createdBy,
        date: event.createdAt,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    setRecentActivities(activities);
  }, []);

  return (
    <div className="admin-section">
      <h2>📊 Platform Activity Monitor</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
          <p className="stat-label">Registered accounts</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p className="stat-number">{stats.activeUsers}</p>
          <p className="stat-label">Not suspended</p>
        </div>
        <div className="stat-card">
          <h3>New This Month</h3>
          <p className="stat-number">{stats.newUsersThisMonth}</p>
          <p className="stat-label">New registrations</p>
        </div>
        <div className="stat-card">
          <h3>Communities</h3>
          <p className="stat-number">{stats.totalCommunities}</p>
          <p className="stat-label">Active communities</p>
        </div>
        <div className="stat-card">
          <h3>Posts</h3>
          <p className="stat-number">{stats.totalPosts}</p>
          <p className="stat-label">Total posts</p>
        </div>
        <div className="stat-card">
          <h3>Events</h3>
          <p className="stat-number">{stats.totalEvents}</p>
          <p className="stat-label">Organized events</p>
        </div>
      </div>

      <div className="activity-section">
        <h3>Recent Platform Activity</h3>
        <div className="activity-list">
          {recentActivities.length === 0 ? (
            <p className="empty-state">No recent activity.</p>
          ) : (
            recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-type">
                  {activity.type === "post" ? "📝" : "📅"}
                </span>
                <div className="activity-details">
                  <p className="activity-desc">{activity.description}</p>
                  <p className="activity-meta">
                    By {activity.author} •{" "}
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PlatformActivity;
