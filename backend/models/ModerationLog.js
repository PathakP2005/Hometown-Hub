const mongoose = require("mongoose");

const moderationLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      "approve_member",
      "reject_member",
      "approve_post",
      "reject_post",
      "pin_post",
      "unpin_post",
      "flag_post",
      "approve_comment",
      "reject_comment",
      "flag_comment",
      "create_rule",
      "update_rule",
      "delete_rule",
      "create_event",
      "approve_event",
      "reject_event",
      "assign_moderator",
      "remove_moderator",

      "approve_community_creation",
      "reject_community_creation",
    ],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  targetType: {
    type: String,
    required: true,
    enum: ["user", "post", "comment", "event", "rule", "community", "community_creation_request"],
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  reason: String,
  details: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model("ModerationLog", moderationLogSchema);