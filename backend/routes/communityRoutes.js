const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/adminMiddleware");
const {
  listCommunities,
  createCommunity,
  joinCommunity,
  approveMemberRequest,
  manageRules,
  pinPost,
  assignModerator,
  removeModerator,
  listCommunityCreationRequests,
  approveCommunityCreationRequest,
  rejectCommunityCreationRequest,
} = require("../controllers/communityController");

router.get("/", verifyToken, listCommunities);
router.post("/", verifyToken, createCommunity);
router.post("/:communityId/join", verifyToken, joinCommunity);

// Member management routes
router.post("/:communityId/members/:requestUserId/approve", verifyToken, (req, res) => {
  req.body.action = "approve";
  approveMemberRequest(req, res);
});
router.post("/:communityId/members/:requestUserId/reject", verifyToken, (req, res) => {
  req.body.action = "reject";
  approveMemberRequest(req, res);
});

// Rules management routes
router.post("/:communityId/rules", verifyToken, (req, res) => {
  req.body.action = "add";
  manageRules(req, res);
});
router.put("/:communityId/rules/:ruleId", verifyToken, (req, res) => {
  req.body.action = "update";
  manageRules(req, res);
});
router.delete("/:communityId/rules/:ruleId", verifyToken, (req, res) => {
  req.body.action = "delete";
  manageRules(req, res);
});

// Post pinning routes
router.post("/:communityId/posts/:postId/pin", verifyToken, (req, res) => {
  req.body.action = "pin";
  pinPost(req, res);
});
router.post("/:communityId/posts/:postId/unpin", verifyToken, (req, res) => {
  req.body.action = "unpin";
  pinPost(req, res);
});

// Moderator management routes
router.post("/:communityId/moderators/:targetUserId", verifyToken, assignModerator);
router.delete("/:communityId/moderators/:targetUserId", verifyToken, removeModerator);

// Community Creation Request routes (Admin only)
router.get("/creation-requests", verifyToken, verifyAdmin, listCommunityCreationRequests);
router.post("/creation-requests/:requestId/approve", verifyToken, verifyAdmin, approveCommunityCreationRequest);
router.post("/creation-requests/:requestId/reject", verifyToken, verifyAdmin, rejectCommunityCreationRequest);

module.exports = router;
