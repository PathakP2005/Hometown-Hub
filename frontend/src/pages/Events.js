import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Events.css";

function Events() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUpcoming, setFilterUpcoming] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    setUser(userData);

    const storedEvents = JSON.parse(localStorage.getItem("hometownHubEvents") || "[]");
    setEvents(storedEvents);
  }, [navigate]);

  // Sync events to localStorage
  useEffect(() => {
    if (events.length > 0 || localStorage.getItem("hometownHubEvents")) {
      localStorage.setItem("hometownHubEvents", JSON.stringify(events));
    }
  }, [events]);

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
    setEventTitle("");
    setEventDate("");
    setEventLocation("");
    setEventDescription("");
    alert("Event created successfully!");
  }, [eventTitle, eventDate, eventLocation, eventDescription, user]);

  const joinEvent = useCallback(
    (eventId) => {
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== eventId) return event;

          if (event.attendees.includes(user?.email)) {
            alert("You are already attending this event.");
            return event;
          }

          return {
            ...event,
            attendees: [...event.attendees, user?.email || "anonymous@example.com"],
          };
        })
      );
    },
    [user]
  );

  const leaveEvent = useCallback((eventId) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        return {
          ...event,
          attendees: event.attendees.filter(
            (attendee) => attendee !== user?.email && attendee !== "anonymous@example.com"
          ),
        };
      })
    );
  }, [user]);

  const deleteEvent = useCallback((eventId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    }
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const isEventUpcoming = (eventDate) => {
    try {
      return new Date(eventDate) > new Date();
    } catch {
      return false;
    }
  };

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterUpcoming) {
        return matchesSearch && isEventUpcoming(event.date);
      }

      return matchesSearch;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const userAttendingEventIds = new Set(
    events
      .filter((event) => event.attendees.includes(user?.email))
      .map((event) => event.id)
  );

  if (!user) return <div style={{ padding: "20px" }}>Loading...</div>;

  return (
    <div className="events-container">
      {/* Header Section */}
      <div className="events-header">
        <div className="header-content">
          <h1>🎉 Community Events</h1>
          <p>Discover, create, and attend events in your hometown community</p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Create Event Section */}
        <div className="create-event-section">
          <h2>Create New Event</h2>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Event Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="form-input"
            />
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Location"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="form-input"
            />
          </div>
          <textarea
            placeholder="Event Description (optional)"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="form-textarea"
            rows="3"
          />
          <button className="btn-primary" onClick={createEvent}>
            + Create Event
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <input
            type="text"
            placeholder="Search events by title, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filterUpcoming}
              onChange={(e) => setFilterUpcoming(e.target.checked)}
            />
            <span>Upcoming Events Only</span>
          </label>
        </div>

        {/* Events List */}
        <div className="events-list">
          {sortedEvents.length === 0 ? (
            <div className="empty-state">
              <p>No events found. Create one or check back later!</p>
            </div>
          ) : (
            sortedEvents.map((event) => {
              const isAttending = userAttendingEventIds.has(event.id);
              const isUpcoming = isEventUpcoming(event.date);

              return (
                <div
                  key={event.id}
                  className={`event-card ${!isUpcoming ? "past-event" : ""}`}
                >
                  <div className="event-header">
                    <div>
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-organizer">
                        Organized by: <strong>{event.organizer}</strong>
                      </p>
                    </div>
                    {!isUpcoming && <span className="past-badge">Past Event</span>}
                  </div>

                  <div className="event-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">👥</span>
                      <span>{event.attendees.length} attending</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  <div className="event-actions">
                    {event.organizer === user?.name ? (
                      <button
                        className="btn-danger"
                        onClick={() => deleteEvent(event.id)}
                      >
                        Delete Event
                      </button>
                    ) : isAttending ? (
                      <button
                        className="btn-secondary"
                        onClick={() => leaveEvent(event.id)}
                      >
                        Leave Event
                      </button>
                    ) : (
                      <button
                        className={`btn-primary ${!isUpcoming ? "disabled" : ""}`}
                        onClick={() => joinEvent(event.id)}
                        disabled={!isUpcoming}
                      >
                        Join Event
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Events;
