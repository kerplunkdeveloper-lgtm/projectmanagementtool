const express = require("express");
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router
  .route("/")
  .get(getTasks)
  .post(authorize("admin", "operationmanager"), createTask);

router
  .route("/:id")
  .put(updateTask)
  .delete(authorize("admin", "operationmanager"), deleteTask);

module.exports = router;
