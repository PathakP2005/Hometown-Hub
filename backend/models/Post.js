const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },
  flags: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      reason: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  flagCount: {
    type: Number,
    default: 0,
  },
  moderation: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    rejectionReason: String,
    modifiedAt: Date,
  },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["discussion", "announcement", "event"],
    default: "discussion",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "pinned"],
    default: "approved",
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  comments: [commentSchema],
  flags: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      reason: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  flagCount: {
    type: Number,
    default: 0,
  },
  moderation: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    rejectionReason: String,
    modifiedAt: Date,
  },
  eventDetails: {
    date: Date,
    location: String,
    maxAttendees: Number,
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);