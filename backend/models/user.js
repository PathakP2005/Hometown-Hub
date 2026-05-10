const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  hometown: String,
  role: {
    type: String,
    enum: ["admin", "moderator", "member"],
    default: "member",
  },
  isCommunityModerator: [
    {
      communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
      },
      permissions: {
        type: [String],
        enum: ["approve_members", "moderate_posts", "manage_rules", "pin_posts", "manage_events"],
        default: ["approve_members", "moderate_posts"],
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  joinedCommunities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  ],
  pendingCommunities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);