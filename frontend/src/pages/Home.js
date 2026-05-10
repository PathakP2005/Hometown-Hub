 import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import "../styles/HomepageBanner.css";
import "../styles/ScrollAnimations.css";

function Home() {

  //  STATES
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [commentInputs, setCommentInputs] = useState({});

  //  INITIAL LOAD
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    setUser(userData);

    const storedPosts = JSON.parse(localStorage.getItem("hometownHubPosts") || "[]");
    const storedEvents = JSON.parse(localStorage.getItem("hometownHubEvents") || "[]");
    const storedNotifications = JSON.parse(localStorage.getItem("hometownHubNotifications") || "[]");

    setPosts(storedPosts);
    setEvents(storedEvents);
    setNotifications(storedNotifications);
  }, [navigate]);

  //  SYNC POSTS TO LOCALSTORAGE
  useEffect(() => {
    if (posts.length > 0 || localStorage.getItem("hometownHubPosts")) {
      localStorage.setItem("hometownHubPosts", JSON.stringify(posts));
    }
  }, [posts]);

  //  SYNC EVENTS TO LOCALSTORAGE
  useEffect(() => {
    if (events.length > 0 || localStorage.getItem("hometownHubEvents")) {
      localStorage.setItem("hometownHubEvents", JSON.stringify(events));
    }
  }, [events]);

  //  SYNC NOTIFICATIONS TO LOCALSTORAGE
  useEffect(() => {
    if (notifications.length > 0 || localStorage.getItem("hometownHubNotifications")) {
      localStorage.setItem("hometownHubNotifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  //  LOGOUT
   /*const logout = () => {
    localStorage.clear();
    navigate("/login");
  }; */

  const addNotification = useCallback((message) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        message,
        time: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  }, []);

  const createPost = useCallback(() => {
    if (!postText.trim()) {
      alert("Please add text to your post.");
      return;
    }

    const newPost = {
      id: `post-${Date.now()}`,
      author: user?.name || "Hometown Member",
      text: postText.trim(),
      imageUrl: imageUrl.trim(),
      type: isAnnouncement ? "announcement" : "post",
      likes: 0,
      shares: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
    addNotification(`${user?.name || "Someone"} shared a new ${isAnnouncement ? "announcement" : "community update"}.`);
    setPostText("");
    setImageUrl("");
    setIsAnnouncement(false);
  }, [postText, imageUrl, isAnnouncement, user, addNotification]);

  const addComment = useCallback((postId) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `comment-${Date.now()}`,
                  author: user?.name || "Anonymous",
                  text: commentText,
                  createdAt: new Date().toLocaleString(),
                },
              ],
            }
          : post
      )
    );

    addNotification(`${user?.name || "Someone"} commented on a post.`);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  }, [commentInputs, user, addNotification]);

  const likePost = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }, []);

  const sharePost = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post
      )
    );
    addNotification(`${user?.name || "Someone"} shared a post.`);
  }, [addNotification, user]);

  const createEvent = useCallback(() => {
    if (!eventTitle.trim() || !eventDate.trim() || !eventLocation.trim()) {
      alert("Please fill in event title, date, and location.");
      return;
    }

    const newEvent = {
      id: `event-${Date.now()}`,
      title: eventTitle.trim(),
      date: eventDate,
      location: eventLocation.trim(),
      description: eventDescription.trim(),
      organizer: user?.name || "Community Member",
      attendees: [user?.email || "anonymous@example.com"],
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
    addNotification(`${user?.name || "Someone"} created a new event: ${eventTitle.trim()}.`);
    setEventTitle("");
    setEventDate("");
    setEventLocation("");
    setEventDescription("");
  }, [eventTitle, eventDate, eventLocation, eventDescription, user, addNotification]);

  const joinEvent = useCallback((eventId) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        if (event.attendees.includes(user?.email)) {
          return event;
        }

        return {
          ...event,
          attendees: [...event.attendees, user?.email || "anonymous@example.com"],
        };
      })
    );

    const targetEvent = events.find((event) => event.id === eventId);
    if (targetEvent) {
      addNotification(`${user?.name || "Someone"} joined the event: ${targetEvent.title}.`);
    }
  }, [user, events, addNotification]);

  const markNotificationsRead = useCallback(() => {
    localStorage.removeItem("hometownHubNotifications");
    setNotifications([]);
  }, []);

  // Scroll animations setup
  useEffect(() => {
    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all scroll-animate elements
    const animateElements = document.querySelectorAll(".scroll-animate");
    animateElements.forEach((el) => observer.observe(el));

    // Scroll progress bar
    const scrollProgress = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = height > 0 ? (scrolled / height) * 100 : 0;
      
      let progressBar = document.querySelector(".scroll-progress");
      if (!progressBar) {
        progressBar = document.createElement("div");
        progressBar.className = "scroll-progress";
        document.body.insertBefore(progressBar, document.body.firstChild);
      }
      progressBar.style.width = scrollPercent + "%";
    };

    window.addEventListener("scroll", scrollProgress);

    return () => {
      window.removeEventListener("scroll", scrollProgress);
      observer.disconnect();
    };
  }, []);

  const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedEvents = [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!user) return <div style={{ padding: "20px" }}>Loading...</div>;

  // UI
  return (
    <>
      {/* Hometown-Hub Banner */}
      <div className="homepage-banner">
        <div className="banner-content">
          <div className="banner-logo">🏘️</div>
          <h1 className="banner-title">Hometown Hub</h1>
          <p className="banner-subtitle">Connect. Celebrate. Build Together.</p>
          <p className="banner-description">
            Welcome to your community hub! Share updates, organize events, join communities, and build meaningful connections with your neighbors in your hometown.
          </p>

          <div className="banner-stats">
            <div className="banner-stat">
              <div className="banner-stat-number">{sortedPosts.length}</div>
              <div className="banner-stat-label">Community Updates</div>
            </div>
            <div className="banner-stat">
              <div className="banner-stat-number">{sortedEvents.length}</div>
              <div className="banner-stat-label">Upcoming Events</div>
            </div>
            <div className="banner-stat">
              <div className="banner-stat-number">{notifications.length}</div>
              <div className="banner-stat-label">Notifications</div>
            </div>
          </div>

          <div className="banner-cta-group">
            <button
              className="banner-btn banner-btn-primary"
              onClick={() => navigate("/communities")}
            >
              🌍 Explore Communities
            </button>
            <button
              className="banner-btn banner-btn-secondary"
              onClick={() => navigate("/events")}
            >
              🎉 View Events
            </button>
          </div>

          <div className="banner-features">
            <div className="banner-feature">
              <span className="banner-feature-icon">💬</span>
              <div className="banner-feature-text">Share Updates</div>
            </div>
            <div className="banner-feature">
              <span className="banner-feature-icon">🎊</span>
              <div className="banner-feature-text">Create Events</div>
            </div>
            <div className="banner-feature">
              <span className="banner-feature-icon">👥</span>
              <div className="banner-feature-text">Join Communities</div>
            </div>
            <div className="banner-feature">
              <span className="banner-feature-icon">🤝</span>
              <div className="banner-feature-text">Connect Together</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="home-container">
        <div className="home-wrapper">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-content">
              <h1 className="welcome-greeting">
              Welcome back, <span className="user-name-gradient">{user?.name}</span>! 👋
            </h1>
            <p className="welcome-description">
              Ready to connect with your community and make a difference?
            </p>
            <span className="hometown-badge">📍 {user?.hometown || "Your Hometown"}</span>
          </div>
        </div>

        {/* Community Info Section */}
        <div className="community-info-section">
          <h2>🏘️ Hometown Hub - Connect with Your Neighbors</h2>
          <p>Share updates, create events, join communities, and make meaningful connections in your hometown</p>
        </div>

        {/* Main Grid */}
        <div className="home-grid">
          {/* LEFT COLUMN - Main Content */}
          <div>
            {/* Share Update Card */}
            <div className="card share-update-card">
              <div className="card-header">
                <span className="card-icon">✍️</span>
                <h2 className="card-title">Share Your Update</h2>
              </div>
              <p className="card-description">
                Share what's happening in your hometown community. Post updates, announcements, or images!
              </p>

              <form onSubmit={(e) => { e.preventDefault(); createPost(); }}>
                <div className="form-group">
                  <textarea
                    placeholder="What's happening in your hometown? 🌟"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Image URL (optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="announcementCheckbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                  />
                  <label htmlFor="announcementCheckbox">📢 Mark as Important Announcement</label>
                </div>

                <button type="submit" className="btn btn-primary">
                  📤 Post Update
                </button>
              </form>
            </div>

            {/* Community Feed Section */}
            <div className="posts-section">
              <h2 className="section-title">💬 Community Feed</h2>

              {sortedPosts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-emoji">💭</div>
                  <p>No posts yet. Be the first to share something amazing!</p>
                </div>
              ) : (
                sortedPosts.map((post) => (
                  <div key={post.id} className={`post-item ${post.type === "announcement" ? "announcement" : ""}`}>
                    <div className="post-header">
                      <div>
                        <span className={`post-author ${post.type === "announcement" ? "announcement" : ""}`}>
                          {post.type === "announcement" ? "📣 " : "👤 "}{post.author}
                        </span>
                        <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="post-content">{post.text}</p>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt="Post" className="post-image" onError={(e) => e.target.style.display = "none"} />
                    )}
                    <div className="post-actions">
                      <button type="button" onClick={() => likePost(post.id)} className="post-action-btn">
                        👍 Like ({post.likes})
                      </button>
                      <button type="button" onClick={() => sharePost(post.id)} className="post-action-btn">
                        🔗 Share ({post.shares})
                      </button>
                    </div>

                    {post.comments.length > 0 && (
                      <div className="post-comments">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <span className="comment-author">{comment.author}</span>: {comment.text}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="comment-input-group">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        className="comment-input"
                      />
                      <button type="button" onClick={() => addComment(post.id)} className="btn btn-primary btn-sm">
                        💬
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Events Section */}
            <div className="events-section">
              <h2 className="section-title">🎉 Community Events</h2>

              <div className="card">
                <div className="card-header">
                  <span className="card-icon">🎊</span>
                  <h3 className="card-title">Create New Event</h3>
                </div>
                <p className="card-description">
                  Organize community events and bring neighbors together!
                </p>

                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Event title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Location"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    placeholder="Event description (optional)"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <button
                  type="button"
                  onClick={createEvent}
                  className="btn btn-success"
                >
                  🎫 Create Event
                </button>
              </div>

              {sortedEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-emoji">📅</div>
                  <p>No upcoming events. Create one and bring your community together!</p>
                </div>
              ) : (
                sortedEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-detail">
                      <span className="event-detail-icon">📅</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="event-detail">
                      <span className="event-detail-icon">📍</span>
                      <span>{event.location}</span>
                    </div>
                    {event.description && (
                      <div className="event-detail">
                        <span className="event-detail-icon">📝</span>
                        <span>{event.description}</span>
                      </div>
                    )}
                    <div className="event-detail">
                      <span className="event-detail-icon">👥</span>
                      <span>{event.attendees.length} attending</span>
                    </div>
                    <div className="event-organizer">👨‍💼 Organized by {event.organizer}</div>
                    <button type="button" onClick={() => joinEvent(event.id)} className="btn btn-primary btn-sm" style={{ marginTop: "10px" }}>
                      🎫 Join Event
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="sidebar">
            {/* Notifications Card */}
            <div className="sidebar-card">
              <h3 className="sidebar-title">🔔 Notifications</h3>
              {notifications.length > 0 && (
                <button type="button" onClick={markNotificationsRead} className="btn btn-secondary" style={{ width: "100%", marginBottom: "12px" }}>
                  Clear All
                </button>
              )}
              {notifications.length === 0 ? (
                <p style={{ color: "#999", margin: "0", textAlign: "center", padding: "20px" }}>No notifications yet</p>
              ) : (
                <div>
                  {notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <p className="notification-message">{notif.message}</p>
                      <p className="notification-time">{notif.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Card */}
            <div className="sidebar-card">
              <h3 className="sidebar-title">📊 Quick Stats</h3>
              <div className="stat-item">
                <span className="stat-label">📝 Posts</span>
                <span className="stat-value">{sortedPosts.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">🎉 Events</span>
                <span className="stat-value">{sortedEvents.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">🔔 Notifications</span>
                <span className="stat-value">{notifications.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Home;
