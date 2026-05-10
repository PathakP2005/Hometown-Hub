const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  maxAttendees: {
    type: Number,
    default: null,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming",
  },
  isApproved: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model("Event", eventSchema);