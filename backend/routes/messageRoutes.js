const express = require("express");
const {
  getDirectMessages,
  getGroupMessages,
  sendMessage,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", sendMessage);
router.get("/group/:roomId?", getGroupMessages);
router.get("/direct/:userId", getDirectMessages);

// Custom Group Chat Room Routes
router.get("/rooms", getRooms);
router.post("/rooms", createRoom);
router.put("/rooms/:id", updateRoom);
router.delete("/rooms/:id", deleteRoom);

module.exports = router;
