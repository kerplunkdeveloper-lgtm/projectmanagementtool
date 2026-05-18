const express = require("express");
const {
  getBusinessProjects,
  createBusinessProject,
  updateBusinessProject,
  deleteBusinessProject,
  assignEmployee,
} = require("../controllers/businessProjectController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getBusinessProjects)
  .post(protect, authorize("admin"), createBusinessProject);

router
  .route("/:id/assign")
  .post(protect, authorize("admin"), assignEmployee);

router
  .route("/:id")
  .put(protect, authorize("admin"), updateBusinessProject)
  .delete(protect, authorize("admin"), deleteBusinessProject);

module.exports = router;
