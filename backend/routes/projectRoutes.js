const express = require("express");
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, getProjects)
  .post(protect, authorize("admin", "operationmanager"), createProject);

router
  .route("/:id")
  .put(protect, authorize("admin", "operationmanager"), updateProject)
  .delete(protect, authorize("admin", "operationmanager"), deleteProject);

module.exports = router;
