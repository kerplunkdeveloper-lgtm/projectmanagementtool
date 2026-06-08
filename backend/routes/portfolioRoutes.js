const express = require("express");
const {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addProjectsToPortfolio,
  removeProjectFromPortfolio,
} = require("../controllers/portfolioController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, getPortfolios)
  .post(protect, authorize("admin", "OperationManager"), createPortfolio);

router
  .route("/:id")
  .put(protect, authorize("admin", "OperationManager"), updatePortfolio)
  .delete(protect, authorize("admin", "OperationManager"), deletePortfolio);

router
  .route("/:id/projects")
  .put(protect, authorize("admin", "OperationManager"), addProjectsToPortfolio);

router
  .route("/:id/projects/:projectId")
  .delete(protect, authorize("admin", "OperationManager"), removeProjectFromPortfolio);

module.exports = router;
