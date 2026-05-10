import { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    hometown: "",
    currentCity: "",
    bio: "",
    role: "member",
  });
  const [loading, setLoading] = useState(true);
  const [isMakingAdmin, setIsMakingAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) {
      setUser({
        name: storedUser.name || "",
        email: storedUser.email || "",
        hometown: storedUser.hometown || "",
        currentCity: storedUser.currentCity || "",
        bio: storedUser.bio || "",
        role: storedUser.role || "member",
      });
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (res.data?.user) {
          setUser((prev) => ({
            ...prev,
            ...res.data.user,
            hometown: res.data.user.hometown || prev.hometown,
            currentCity: res.data.user.currentCity || prev.currentCity,
            bio: res.data.user.bio || prev.bio,
          }));
        }
      } catch (err) {
        console.log("Profile load failed, using local data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = () => {
    localStorage.setItem("user", JSON.stringify(user));
    alert("Profile saved locally.");
  };

  const makeAdmin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to become admin.");
      return;
    }

    try {
      setIsMakingAdmin(true);
      const res = await axios.post(
        "http://localhost:5000/api/auth/make-admin",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.user) {
        setUser((prev) => ({ ...prev, ...res.data.user }));
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      alert(res.data?.message || "You are now admin.");
    } catch (err) {
      console.error("Make admin failed", err);
      alert(err.response?.data?.message || "Unable to become admin.");
    } finally {
      setIsMakingAdmin(false);
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Profile</h1>
      <p>Keep your hometown details up to date for local connections.</p>

      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "10px", background: "#fff" }}>
        <label style={{ display: "block", marginBottom: "12px" }}>
          Name
          <input
            type="text"
            value={user.name}
            onChange={(e) => handleChange("name", e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          Email
          <input
            type="email"
            value={user.email}
            onChange={(e) => handleChange("email", e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          Hometown
          <input
            type="text"
            value={user.hometown}
            onChange={(e) => handleChange("hometown", e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          Current city
          <input
            type="text"
            value={user.currentCity}
            onChange={(e) => handleChange("currentCity", e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "12px" }}>
          About your hometown
          <textarea
            rows={4}
            value={user.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <button onClick={saveProfile} style={{ padding: "10px 16px", marginRight: "12px" }}>
          Save Profile
        </button>
        <button onClick={() => (window.location.href = "/")} style={{ padding: "10px 16px", marginRight: "12px" }}>
          Back to Home
        </button>
        {user.role === "admin" ? (
          <button onClick={() => (window.location.href = "/admin")} style={{ padding: "10px 16px", background: "#1d4ed8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Admin Dashboard
          </button>
        ) : (
          <button onClick={makeAdmin} disabled={isMakingAdmin} style={{ padding: "10px 16px", background: "#047857", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            {isMakingAdmin ? "Updating role..." : "Make me admin"}
          </button>
        )}
      </div>

      <section style={{ marginTop: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "10px", background: "#fff" }}>
        <h2>Profile preview</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Hometown:</strong> {user.hometown || "Not specified"}</p>
        <p><strong>Current city:</strong> {user.currentCity || "Not specified"}</p>
        <p><strong>Role:</strong> {user.role || "member"}</p>
        <p><strong>About:</strong> {user.bio || "No hometown details added yet."}</p>
      </section>
    </div>
  );
}

export default Profile;
