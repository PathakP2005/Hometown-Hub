import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navigation.css";

function Navigation({ user }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand" onClick={() => navigate("/")}>
          <span className="logo-icon">🏘️</span>
          <span className="brand-name">Hometown Hub</span>
        </div>

        {/* Navigation Links */}
        <ul className="nav-links">
          <li>
            <button
              className="nav-link"
              onClick={() => navigate("/")}
              aria-label="Home"
            >
              Home
            </button>
          </li>
          <li>
            <button
              className="nav-link"
              onClick={() => navigate("/communities")}
              aria-label="Communities"
            >
              Communities
            </button>
          </li>
          <li>
            <button
              className="nav-link"
              onClick={() => navigate("/events")}
              aria-label="Events"
            >
              Events
            </button>
          </li>
        </ul>

        {/* User Menu */}
        <div className="user-menu">
          {user && (
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <div className="dropdown">
                <button
                  className="user-avatar"
                  onClick={toggleDropdown}
                  aria-label="User menu"
                >
                  👤
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate("/profile");
                        setIsDropdownOpen(false);
                      }}
                    >
                      My Profile
                    </button>
                    {user?.role === "admin" && (
                      <button
                        className="dropdown-item admin-item"
                        onClick={() => {
                          navigate("/admin");
                          setIsDropdownOpen(false);
                        }}
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <hr className="dropdown-divider" />
                    <button
                      className="dropdown-item logout-item"
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
