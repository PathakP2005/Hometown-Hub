const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createPost,
  getPosts,
  moderatePost,
  addComment,
  moderateComment,
  flagPost,
  flagComment,
  joinEvent,
  leaveEvent,
} = require("../controllers/postController");

// Post routes
router.post("/", verifyToken, createPost);
router.get("/community/:communityId", verifyToken, getPosts);

// Post moderation routes
router.post("/:postId/approve", verifyToken, (req, res) => {
  req.body.action = "approve";
  moderatePost(req, res);
});
router.post("/:postId/reject", verifyToken, (req, res) => {
  req.body.action = "reject";
  moderatePost(req, res);
});

// Comment routes
router.post("/:postId/comments", verifyToken, addComment);

// Comment moderation routes
router.post("/:postId/comments/:commentId/approve", verifyToken, (req, res) => {
  req.body.action = "approve";
  moderateComment(req, res);
});
router.post("/:postId/comments/:commentId/reject", verifyToken, (req, res) => {
  req.body.action = "reject";
  moderateComment(req, res);
});

// Flagging routes
router.post("/:postId/flag", verifyToken, flagPost);
router.post("/:postId/comments/:commentId/flag", verifyToken, flagComment);

// Event attendance routes
router.post("/:postId/join", verifyToken, joinEvent);
router.post("/:postId/leave", verifyToken, leaveEvent);

module.exports = router;