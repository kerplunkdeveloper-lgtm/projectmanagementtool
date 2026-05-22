const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");

// @desc    Get direct messages between logged in user and another user
// @route   GET /api/messages/direct/:userId
// @access  Private
exports.getDirectMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: otherUserId, chatRoom: "direct" },
        { sender: otherUserId, recipient: req.user.id, chatRoom: "direct" },
      ],
    })
      .sort("createdAt")
      .populate({
        path: "sender",
        select: "name email role profile",
        populate: { path: "profile" }
      })
      .populate({
        path: "recipient",
        select: "name email role profile",
        populate: { path: "profile" }
      });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group messages (accepts roomId parameter)
// @route   GET /api/messages/group/:roomId
// @access  Private
exports.getGroupMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId || "group";
    const messages = await Message.find({ chatRoom: roomId })
      .sort("createdAt")
      .populate({
        path: "sender",
        select: "name email role profile",
        populate: { path: "profile" }
      });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message (REST API)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { recipient, chatRoom, text, sticker, messageType, callStatus, callDuration } = req.body;

    const message = await Message.create({
      sender: req.user.id,
      recipient: (chatRoom === "group" || chatRoom !== "direct") ? null : recipient,
      chatRoom: chatRoom || "direct",
      text,
      sticker,
      messageType: messageType || "text",
      callStatus,
      callDuration,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate({
        path: "sender",
        select: "name email role profile",
        populate: { path: "profile" }
      })
      .populate({
        path: "recipient",
        select: "name email role profile",
        populate: { path: "profile" }
      });

    const io = req.app.get("io");

    if (chatRoom === "group") {
      // Emit to all users in group chat
      if (io) {
        io.to("group_chat").emit("group_message", populatedMessage);
      }
    } else if (chatRoom !== "direct") {
      // Custom Group Chat Room: Emit to all members of the group
      const room = await ChatRoom.findById(chatRoom);
      if (room && io) {
        room.members.forEach((memberId) => {
          io.to(memberId.toString()).emit("group_message", populatedMessage);
        });
      }
    } else {
      // Emit to both sender and recipient rooms
      if (io) {
        io.to(req.user.id.toString()).emit("direct_message", populatedMessage);
        io.to(recipient.toString()).emit("direct_message", populatedMessage);
        
        // Also send a real-time notification to the recipient so they get a chime + toast immediately if on a different page!
        const notification = await Notification.create({
          recipient,
          sender: req.user.id,
          type: "message_received",
          message: `New message from ${req.user.name}: "${text || (messageType === 'sticker' ? 'Sent a sticker' : 'Call log')}"`,
        });
        
        const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
        io.to(recipient.toString()).emit("notification", populatedNotification);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all custom groups the user is member of
// @route   GET /api/messages/rooms
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ members: req.user.id })
      .populate("creator", "name email role")
      .populate({
        path: "members",
        select: "name email role profile",
        populate: { path: "profile" }
      });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a custom group
// @route   POST /api/messages/rooms
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    // Always include creator as member
    const uniqueMembers = Array.from(new Set([...members, req.user.id]));

    const room = await ChatRoom.create({
      name,
      description,
      creator: req.user.id,
      members: uniqueMembers,
    });

    const populatedRoom = await ChatRoom.findById(room._id)
      .populate("creator", "name email role")
      .populate({
        path: "members",
        select: "name email role profile",
        populate: { path: "profile" }
      });

    res.status(201).json({
      success: true,
      data: populatedRoom,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update room details or members list
// @route   PUT /api/messages/rooms/:id
// @access  Private
exports.updateRoom = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Update fields
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (members) {
      // Ensure creator is always in the room
      room.members = Array.from(new Set([...members, room.creator.toString()]));
    }

    await room.save();

    const populatedRoom = await ChatRoom.findById(room._id)
      .populate("creator", "name email role")
      .populate({
        path: "members",
        select: "name email role profile",
        populate: { path: "profile" }
      });

    res.status(200).json({
      success: true,
      data: populatedRoom,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete custom group
// @route   DELETE /api/messages/rooms/:id
// @access  Private
exports.deleteRoom = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Only creator or admin can delete
    if (room.creator.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this group" });
    }

    await room.deleteOne();

    res.status(200).json({
      success: true,
      data: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
