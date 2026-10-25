const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const chatUpload = require("../middleware/chatUpload");

const {
  getHrTasks,
  getHrTaskMetrics,
  getHrUsers,
  getHrTaskById,
  createHrTask,
  updateHrTask,
  updateHrTaskStatus,
  toggleChecklistItem,
  flagBlocker,
  submitHrTask,
  reviewHrTask,
  addComment,
  cancelHrTask,
  deleteHrTask,
  uploadAttachment,
} = require("../controllers/hrTaskController");

// All routes are protected
router.use(protect);

// Metrics & HR Users
router.get("/metrics", getHrTaskMetrics);
router.get("/hr-users", getHrUsers);

// File attachment upload
router.post("/upload", chatUpload.single("file"), uploadAttachment);

// Task CRUD
router.route("/")
  .get(getHrTasks)
  .post(createHrTask);

router.route("/:id")
  .get(getHrTaskById)
  .put(updateHrTask)
  .delete(deleteHrTask);

// Task status & actions
router.patch("/:id/status", updateHrTaskStatus);
router.patch("/:id/checklist/:itemId", toggleChecklistItem);
router.post("/:id/blocker", flagBlocker);
router.post("/:id/submit", submitHrTask);
router.post("/:id/review", reviewHrTask);
router.post("/:id/comments", addComment);
router.post("/:id/cancel", cancelHrTask);

module.exports = router;
