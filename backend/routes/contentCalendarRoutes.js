const express = require("express");
const {
  getContentTasks,
  createContentTask,
  updateContentTask,
  deleteContentTask,
  bulkAction,
} = require("../controllers/contentCalendarController");

const { protect } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, getContentTasks)
  .post(protect, createContentTask);

router.post("/bulk", protect, bulkAction);

router
  .route("/:id")
  .put(protect, updateContentTask)
  .delete(protect, deleteContentTask);

module.exports = router;
