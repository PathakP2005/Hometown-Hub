const Community = require("../models/Community");
const User = require("../models/user");
const ModerationLog = require("../models/ModerationLog");
const CommunityCreationRequest = require("../models/CommunityCreationRequest");

exports.listCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .select("name type location description members creator moderators memberRequests rules pinnedPosts settings createdAt")
      .populate("creator", "name")
      .populate("moderators", "name");

    res.json({ communities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCommunity = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { name, type, city, location, description, requireApproval } = req.body;

    if (!name || !city || !location) {
      return res.status(400).json({ message: "Community name, city, and location are required." });
    }

    const existingCommunity = await Community.findOne({
      name: name.trim(),
      city: city.trim(),
      location: location.trim(),
    });

    if (existingCommunity) {
      return res.status(400).json({ message: "A community with that name, city, and location already exists." });
    }

    // Check if user already has a pending request for this community
    const existingRequest = await CommunityCreationRequest.findOne({
      name: name.trim(),
      city: city.trim(),
      location: location.trim(),
      requestedBy: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending community creation request for this name, city, and location." });
    }

    // Create community creation request
    const request = new CommunityCreationRequest({
      name: name.trim(),
      type: type || "City",
      city: city.trim(),
      location: location.trim(),
      description: description?.trim() || "",
      requireApproval: requireApproval || false,
      requestedBy: userId,
    });

    await request.save();

    const requestingUser = await User.findById(userId);
    const isAdmin = requestingUser?.role === "admin";

    if (isAdmin) {
      const community = new Community({
        name: request.name,
        type: request.type,
        city: request.city,
        location: request.location,
        description: request.description,
        creator: request.requestedBy,
        moderators: [request.requestedBy],
        members: [request.requestedBy],
        settings: {
          requireApproval: request.requireApproval,
        },
      });

      await community.save();

      await User.findByIdAndUpdate(
        request.requestedBy,
        { $addToSet: { joinedCommunities: community._id } },
        { new: true }
      );

      request.status = "approved";
      request.reviewedBy = userId;
      request.reviewedAt = new Date();
      request.reviewReason = "Approved by admin.";
      await request.save();

      await ModerationLog.create({
        action: "approve_community_creation",
        userId,
        targetId: request._id,
        targetType: "community_creation_request",
        reason: "Approved by admin.",
      });

      return res.status(201).json({
        community,
        request,
        message: "Community created successfully.",
      });
    }

    res.status(201).json({
      request,
      message: "Community creation request submitted. Waiting for admin approval.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinCommunity = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Check if user is already a member
    if (community.members.some((memberId) => memberId.toString() === userId)) {
      return res.status(400).json({ message: "You are already a member of this community." });
    }

    // Check if user already has a pending request
    const existingRequest = community.memberRequests.find(
      (request) => request.userId.toString() === userId && request.status === "pending"
    );
    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending membership request." });
    }

    const requireApproval = community.settings?.requireApproval || false;

    if (requireApproval) {
      // Add to pending requests
      community.memberRequests.push({
        userId,
        status: "pending",
        requestedAt: new Date(),
      });
      await community.save();

      // Add to user's pending communities
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { pendingCommunities: community._id } },
        { new: true }
      );

      res.json({ message: "Membership request submitted. Waiting for approval." });
    } else {
      // Auto-approve
      community.members.push(userId);
      await community.save();

      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { joinedCommunities: community._id } },
        { new: true }
      ).select("-password");

      res.json({ community, user, message: "Successfully joined the community." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveMemberRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId, requestUserId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Check if user is a moderator or creator
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to manage member requests." });
    }

    const requestIndex = community.memberRequests.findIndex(
      (request) => request.userId.toString() === requestUserId && request.status === "pending"
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Pending request not found." });
    }

    const request = community.memberRequests[requestIndex];

    if (action === "approve") {
      community.members.push(requestUserId);
      request.status = "approved";
      request.reviewedAt = new Date();
      request.reviewedBy = userId;

      // Remove from user's pending communities and add to joined
      await User.findByIdAndUpdate(
        requestUserId,
        {
          $pull: { pendingCommunities: community._id },
          $addToSet: { joinedCommunities: community._id }
        },
        { new: true }
      );
    } else if (action === "reject") {
      request.status = "rejected";
      request.reviewedAt = new Date();
      request.reviewedBy = userId;

      // Remove from user's pending communities
      await User.findByIdAndUpdate(
        requestUserId,
        { $pull: { pendingCommunities: community._id } },
        { new: true }
      );
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    await community.save();

    // Log the moderation action
    await ModerationLog.create({
      action: action === "approve" ? "approve_member" : "reject_member",
      userId,
      targetId: requestUserId,
      targetType: "user",
      communityId,
      reason: req.body.reason,
    });

    res.json({ community, message: `Member request ${action}d successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.manageRules = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId } = req.params;
    const { action, ruleId, title, content } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Check if user is a moderator or creator
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to manage rules." });
    }

    if (action === "add") {
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
      }

      community.rules.push({
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ModerationLog.create({
        action: "create_rule",
        userId,
        targetId: community.rules[community.rules.length - 1]._id,
        targetType: "rule",
        communityId,
      });
    } else if (action === "update") {
      if (!ruleId || !title || !content) {
        return res.status(400).json({ message: "Rule ID, title, and content are required." });
      }

      const rule = community.rules.id(ruleId);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found." });
      }

      rule.title = title.trim();
      rule.content = content.trim();
      rule.updatedAt = new Date();

      await ModerationLog.create({
        action: "update_rule",
        userId,
        targetId: ruleId,
        targetType: "rule",
        communityId,
      });
    } else if (action === "delete") {
      if (!ruleId) {
        return res.status(400).json({ message: "Rule ID is required." });
      }

      const ruleIndex = community.rules.findIndex(rule => rule._id.toString() === ruleId);
      if (ruleIndex === -1) {
        return res.status(404).json({ message: "Rule not found." });
      }

      community.rules.splice(ruleIndex, 1);

      await ModerationLog.create({
        action: "delete_rule",
        userId,
        targetId: ruleId,
        targetType: "rule",
        communityId,
      });
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'add', 'update', or 'delete'." });
    }

    await community.save();
    res.json({ community, message: `Rule ${action}d successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.pinPost = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId, postId } = req.params;
    const { action } = req.body; // "pin" or "unpin"

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Check if user is a moderator or creator
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to pin posts." });
    }

    const Post = require("../models/Post");
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (action === "pin") {
      if (!community.pinnedPosts.includes(postId)) {
        community.pinnedPosts.push(postId);
        post.isPinned = true;
      }
    } else if (action === "unpin") {
      community.pinnedPosts = community.pinnedPosts.filter(id => id.toString() !== postId);
      post.isPinned = false;
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'pin' or 'unpin'." });
    }

    await community.save();
    await post.save();

    await ModerationLog.create({
      action: action === "pin" ? "pin_post" : "unpin_post",
      userId,
      targetId: postId,
      targetType: "post",
      communityId,
    });

    res.json({ community, post, message: `Post ${action}ned successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignModerator = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId, targetUserId } = req.params;
    const { permissions } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Only creator can assign moderators
    if (community.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only the community creator can assign moderators." });
    }

    // Check if target user is a member
    if (!community.members.some(memberId => memberId.toString() === targetUserId)) {
      return res.status(400).json({ message: "User must be a member before becoming a moderator." });
    }

    // Check if already a moderator
    if (community.moderators.some(mod => mod.toString() === targetUserId)) {
      return res.status(400).json({ message: "User is already a moderator." });
    }

    community.moderators.push(targetUserId);
    await community.save();

    // Update user's moderator status
    await User.findByIdAndUpdate(
      targetUserId,
      {
        $addToSet: {
          isCommunityModerator: {
            communityId,
            permissions: permissions || ["approve_members", "moderate_posts"],
            assignedAt: new Date(),
          }
        }
      },
      { new: true }
    );

    await ModerationLog.create({
      action: "assign_moderator",
      userId,
      targetId: targetUserId,
      targetType: "user",
      communityId,
    });

    res.json({ community, message: "Moderator assigned successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeModerator = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId, targetUserId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Only creator can remove moderators
    if (community.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only the community creator can remove moderators." });
    }

    // Cannot remove creator
    if (community.creator.toString() === targetUserId) {
      return res.status(400).json({ message: "Cannot remove the community creator as moderator." });
    }

    community.moderators = community.moderators.filter(mod => mod.toString() !== targetUserId);
    await community.save();

    // Update user's moderator status
    await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { isCommunityModerator: { communityId } } },
      { new: true }
    );

    await ModerationLog.create({
      action: "remove_moderator",
      userId,
      targetId: targetUserId,
      targetType: "user",
      communityId,
    });

    res.json({ community, message: "Moderator removed successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Community Creation Request Management
exports.listCommunityCreationRequests = async (req, res) => {
  try {
    const requests = await CommunityCreationRequest.find()
      .sort({ createdAt: -1 })
      .populate("requestedBy", "name email")
      .populate("reviewedBy", "name");

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveCommunityCreationRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await CommunityCreationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Community creation request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request has already been processed." });
    }

    // Check if community with same name/location already exists
    const existingCommunity = await Community.findOne({
      name: request.name,
      city: request.city,
      location: request.location,
    });

    if (existingCommunity) {
      return res.status(400).json({ message: "A community with that name, city, and location already exists." });
    }

    // Create the community
    const community = new Community({
      name: request.name,
      type: request.type,
      city: request.city,
      location: request.location,
      description: request.description,
      creator: request.requestedBy,
      moderators: [request.requestedBy], // Creator is automatically a moderator
      members: [request.requestedBy], // Creator is automatically a member
      settings: {
        requireApproval: request.requireApproval,
      },
    });

    await community.save();

    // Update user's joined communities
    await User.findByIdAndUpdate(
      request.requestedBy,
      { $addToSet: { joinedCommunities: community._id } },
      { new: true }
    );

    // Update request status
    request.status = "approved";
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    request.reviewReason = reason || "";
    await request.save();

    // Log the moderation action
    await ModerationLog.create({
      action: "approve_community_creation",
      userId,
      targetId: requestId,
      targetType: "community_creation_request",
      reason,
    });

    res.json({ community, request, message: "Community creation request approved successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectCommunityCreationRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await CommunityCreationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Community creation request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request has already been processed." });
    }

    // Update request status
    request.status = "rejected";
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    request.reviewReason = reason || "";
    await request.save();

    // Log the moderation action
    await ModerationLog.create({
      action: "reject_community_creation",
      userId,
      targetId: requestId,
      targetType: "community_creation_request",
      reason,
    });

    res.json({ request, message: "Community creation request rejected successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
