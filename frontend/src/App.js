import React, { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Home = lazy(() => import("./pages/Home"));
const Communities = lazy(() => import("./pages/Communities"));
const Events = lazy(() => import("./pages/Events"));
const Admin = lazy(() => import("./pages/Admin"));

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    setUser(userData);

  }, []);

  // Get current location for context (optional)
 /* useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
      });
    }
  }, []);*/

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        {user && <Navigation user={user} />}
        <main className="main-content">
          <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/events" element={<Events />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;