const Post = require("../models/Post");
const Community = require("../models/Community");
const User = require("../models/user");
const ModerationLog = require("../models/ModerationLog");

exports.createPost = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId, title, content, type, eventDetails } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to post." });
    }

    const postData = {
      author: userId,
      communityId,
      title: title.trim(),
      content: content.trim(),
      type: type || "discussion",
    };

    // Handle event details if it's an event post
    if (type === "event" && eventDetails) {
      postData.eventDetails = {
        date: new Date(eventDetails.date),
        location: eventDetails.location,
        maxAttendees: eventDetails.maxAttendees,
        attendees: [userId], // Organizer automatically attends
      };
    }

    // Check if post needs moderation
    if (community.settings.postModeration) {
      postData.status = "pending";
    }

    const post = new Post(postData);
    await post.save();

    // Populate author info for response
    await post.populate("author", "name");

    res.status(201).json({
      post,
      message: community.settings.postModeration
        ? "Post submitted for moderation."
        : "Post created successfully."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { type, status, page = 1, limit = 20 } = req.query;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    const query = { communityId };

    if (type) query.type = type;
    if (status) query.status = status;

    const posts = await Post.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("author", "name")
      .populate("comments.author", "name")
      .populate("eventDetails.attendees", "name");

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.moderatePost = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId } = req.params;
    const { action, reason } = req.body; // "approve", "reject"

    const post = await Post.findById(postId).populate("communityId");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const community = post.communityId;

    // Check if user is a moderator or creator
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to moderate posts." });
    }

    if (action === "approve") {
      post.status = "approved";
      post.moderation.approvedBy = userId;
      post.moderation.modifiedAt = new Date();
    } else if (action === "reject") {
      post.status = "rejected";
      post.moderation.rejectedBy = userId;
      post.moderation.rejectionReason = reason;
      post.moderation.modifiedAt = new Date();
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    await post.save();

    await ModerationLog.create({
      action: action === "approve" ? "approve_post" : "reject_post",
      userId,
      targetId: postId,
      targetType: "post",
      communityId: community._id,
      reason,
    });

    res.json({ post, message: `Post ${action}d successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId).populate("communityId");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const community = post.communityId;

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to comment." });
    }

    const commentData = {
      author: userId,
      content: content.trim(),
    };

    // Check if comments need moderation
    if (community.settings.postModeration) {
      commentData.status = "pending";
    }

    post.comments.push(commentData);
    await post.save();

    // Populate the new comment's author
    const newComment = post.comments[post.comments.length - 1];
    await post.populate("comments.author", "name");

    res.status(201).json({
      comment: newComment,
      message: community.settings.postModeration
        ? "Comment submitted for moderation."
        : "Comment added successfully."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.moderateComment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId, commentId } = req.params;
    const { action, reason } = req.body;

    const post = await Post.findById(postId).populate("communityId");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const community = post.communityId;

    // Check if user is a moderator or creator
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to moderate comments." });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    if (action === "approve") {
      comment.status = "approved";
      comment.moderation.approvedBy = userId;
      comment.moderation.modifiedAt = new Date();
    } else if (action === "reject") {
      comment.status = "rejected";
      comment.moderation.rejectedBy = userId;
      comment.moderation.rejectionReason = reason;
      comment.moderation.modifiedAt = new Date();
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    await post.save();

    await ModerationLog.create({
      action: action === "approve" ? "approve_comment" : "reject_comment",
      userId,
      targetId: commentId,
      targetType: "comment",
      communityId: community._id,
      reason,
    });

    res.json({ comment, message: `Comment ${action}d successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.flagPost = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId } = req.params;
    const { reason } = req.body;

    const post = await Post.findById(postId).populate("communityId");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const community = post.communityId;

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to flag posts." });
    }

    // Check if user already flagged this post
    const existingFlag = post.flags.find(flag => flag.userId.toString() === userId);
    if (existingFlag) {
      return res.status(400).json({ message: "You have already flagged this post." });
    }

    post.flags.push({
      userId,
      reason,
      timestamp: new Date(),
    });
    post.flagCount += 1;
    await post.save();

    await ModerationLog.create({
      action: "flag_post",
      userId,
      targetId: postId,
      targetType: "post",
      communityId: community._id,
      reason,
    });

    res.json({ message: "Post flagged successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.flagComment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId, commentId } = req.params;
    const { reason } = req.body;

    const post = await Post.findById(postId).populate("communityId");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const community = post.communityId;

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to flag comments." });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Check if user already flagged this comment
    const existingFlag = comment.flags.find(flag => flag.userId.toString() === userId);
    if (existingFlag) {
      return res.status(400).json({ message: "You have already flagged this comment." });
    }

    comment.flags.push({
      userId,
      reason,
      timestamp: new Date(),
    });
    comment.flagCount += 1;
    await post.save();

    await ModerationLog.create({
      action: "flag_comment",
      userId,
      targetId: commentId,
      targetType: "comment",
      communityId: community._id,
      reason,
    });

    res.json({ message: "Comment flagged successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId } = req.params;

    const post = await Post.findById(postId).populate("communityId");
    if (!post) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (post.type !== "event") {
      return res.status(400).json({ message: "This post is not an event." });
    }

    const community = post.communityId;

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to join events." });
    }

    // Check if already attending
    if (post.eventDetails.attendees.some(attendeeId => attendeeId.toString() === userId)) {
      return res.status(400).json({ message: "You are already attending this event." });
    }

    // Check capacity
    if (post.eventDetails.maxAttendees && post.eventDetails.attendees.length >= post.eventDetails.maxAttendees) {
      return res.status(400).json({ message: "Event is at maximum capacity." });
    }

    post.eventDetails.attendees.push(userId);
    await post.save();

    res.json({ post, message: "Successfully joined the event." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leaveEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (post.type !== "event") {
      return res.status(400).json({ message: "This post is not an event." });
    }

    // Cannot leave if you're the organizer
    if (post.author.toString() === userId) {
      return res.status(400).json({ message: "Event organizers cannot leave their own events." });
    }

    post.eventDetails.attendees = post.eventDetails.attendees.filter(
      attendeeId => attendeeId.toString() !== userId
    );
    await post.save();

    res.json({ post, message: "Successfully left the event." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};