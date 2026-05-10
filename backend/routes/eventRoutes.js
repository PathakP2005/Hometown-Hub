const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createEvent,
  getEvents,
  moderateEvent,
  updateEvent,
  cancelEvent,
  joinEvent,
  leaveEvent,
} = require("../controllers/eventController");

// Event routes
router.post("/", verifyToken, createEvent);
router.get("/community/:communityId", verifyToken, getEvents);

// Event moderation routes
router.post("/:eventId/approve", verifyToken, (req, res) => {
  req.body.action = "approve";
  moderateEvent(req, res);
});
router.post("/:eventId/reject", verifyToken, (req, res) => {
  req.body.action = "reject";
  moderateEvent(req, res);
});

// Event management routes
router.put("/:eventId", verifyToken, updateEvent);
router.post("/:eventId/cancel", verifyToken, cancelEvent);

// Event attendance routes
router.post("/:eventId/join", verifyToken, joinEvent);
router.post("/:eventId/leave", verifyToken, leaveEvent);

module.exports = router;