const Event = require("../models/Event");
const Community = require("../models/Community");
const ModerationLog = require("../models/ModerationLog");

exports.createEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { communityId, title, description, date, location, maxAttendees } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to create events." });
    }

    // Check if user has permission to create events
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      communityId,
      organizer: userId,
      date: new Date(date),
      location: location.trim(),
      maxAttendees: maxAttendees || null,
      attendees: [userId], // Organizer automatically attends
    };

    // Check if events need moderation
    if (community.settings.allowEvents && !isModerator && !isCreator) {
      eventData.isApproved = false;
    }

    const event = new Event(eventData);
    await event.save();

    await event.populate("organizer", "name");
    await event.populate("attendees", "name");

    await ModerationLog.create({
      action: "create_event",
      userId,
      targetId: event._id,
      targetType: "event",
      communityId,
    });

    res.status(201).json({
      event,
      message: event.isApproved
        ? "Event created successfully."
        : "Event submitted for approval."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { status = "upcoming", page = 1, limit = 20 } = req.query;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found." });
    }

    const query = { communityId };

    if (status === "upcoming") {
      query.date = { $gte: new Date() };
      query.status = "upcoming";
    } else if (status === "past") {
      query.date = { $lt: new Date() };
      query.status = { $in: ["completed", "cancelled"] };
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("organizer", "name")
      .populate("attendees", "name");

    const total = await Event.countDocuments(query);

    res.json({
      events,
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

exports.moderateEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { eventId } = req.params;
    const { action, reason } = req.body; // "approve", "reject"

    const event = await Event.findById(eventId).populate("communityId");
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const community = event.communityId;

    // Check if user is a moderator or creator
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to moderate events." });
    }

    if (action === "approve") {
      event.isApproved = true;
      event.moderation.approvedBy = userId;
      event.moderation.modifiedAt = new Date();
    } else if (action === "reject") {
      event.isApproved = false;
      event.moderation.rejectedBy = userId;
      event.moderation.rejectionReason = reason;
      event.moderation.modifiedAt = new Date();
    } else {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    await event.save();

    await ModerationLog.create({
      action: action === "approve" ? "approve_event" : "reject_event",
      userId,
      targetId: eventId,
      targetType: "event",
      communityId: community._id,
      reason,
    });

    res.json({ event, message: `Event ${action}d successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findById(eventId).populate("communityId");
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Only organizer can update
    if (event.organizer.toString() !== userId) {
      return res.status(403).json({ message: "Only the event organizer can update the event." });
    }

    // Prevent updates to past events
    if (event.date < new Date()) {
      return res.status(400).json({ message: "Cannot update past events." });
    }

    const allowedUpdates = ["title", "description", "date", "location", "maxAttendees"];
    const updateData = {};

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    Object.assign(event, updateData);
    await event.save();

    res.json({ event, message: "Event updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("communityId");
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const community = event.communityId;

    // Check if user is organizer or moderator/creator
    const isOrganizer = event.organizer.toString() === userId;
    const isModerator = community.moderators.some(mod => mod.toString() === userId);
    const isCreator = community.creator.toString() === userId;

    if (!isOrganizer && !isModerator && !isCreator) {
      return res.status(403).json({ message: "You don't have permission to cancel this event." });
    }

    event.status = "cancelled";
    await event.save();

    res.json({ event, message: "Event cancelled successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("communityId");
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (!event.isApproved) {
      return res.status(400).json({ message: "This event has not been approved yet." });
    }

    const community = event.communityId;

    // Check if user is a member
    if (!community.members.some(memberId => memberId.toString() === userId)) {
      return res.status(403).json({ message: "You must be a member of the community to join events." });
    }

    // Atomic update to add attendee if not already present and under capacity
    const updateResult = await Event.findOneAndUpdate(
      {
        _id: eventId,
        attendees: { $ne: userId }, // Not already attending
        $or: [
          { maxAttendees: null },
          { $expr: { $lt: [{ $size: "$attendees" }, "$maxAttendees"] } }
        ]
      },
      { $addToSet: { attendees: userId } },
      { new: true }
    ).populate("attendees", "name");

    if (!updateResult) {
      // Check why it failed
      const currentEvent = await Event.findById(eventId);
      if (currentEvent.attendees.some(attendeeId => attendeeId.toString() === userId)) {
        return res.status(400).json({ message: "You are already attending this event." });
      }
      if (currentEvent.maxAttendees && currentEvent.attendees.length >= currentEvent.maxAttendees) {
        return res.status(400).json({ message: "Event is at maximum capacity." });
      }
      return res.status(400).json({ message: "Unable to join event." });
    }

    res.json({ event: updateResult, message: "Successfully joined the event." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leaveEvent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Cannot leave if you're the organizer
    if (event.organizer.toString() === userId) {
      return res.status(400).json({ message: "Event organizers cannot leave their own events." });
    }

    event.attendees = event.attendees.filter(
      attendeeId => attendeeId.toString() !== userId
    );
    await event.save();

    res.json({ event, message: "Successfully left the event." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};