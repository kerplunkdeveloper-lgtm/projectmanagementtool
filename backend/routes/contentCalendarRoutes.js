const express = require("express");
const router = express.Router();
const {
  getContentCalendarPosts,
  getContentCalendarSummary,
  getContentCalendarPostById,
  createContentCalendarPost,
  bulkCreateContentCalendarPosts,
  uploadContentCalendarMedia,
  updateContentCalendarPost,
  deleteContentCalendarPost,
  clearClientCalendar,
} = require("../controllers/contentCalendarController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

router.get("/summary", getContentCalendarSummary);

router
  .route("/")
  .get(getContentCalendarPosts)
  .post(createContentCalendarPost);

router.post("/bulk", bulkCreateContentCalendarPosts);

router.post(
  "/upload-media",
  upload.array("files", 10),
  uploadContentCalendarMedia
);

router
  .route("/:id")
  .get(getContentCalendarPostById)
  .put(updateContentCalendarPost)
  .delete(deleteContentCalendarPost);

router.delete("/client/:clientId", clearClientCalendar);

module.exports = router;
