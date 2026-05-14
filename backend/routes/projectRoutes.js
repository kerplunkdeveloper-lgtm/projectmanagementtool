const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignProject,
} = require('../controllers/projectController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin', 'qualitylead'), createProject);

router
  .route('/:id')
  .get(protect, getProject)
  .put(protect, authorize('admin', 'qualitylead'), updateProject)
  .delete(protect, authorize('admin', 'qualitylead'), deleteProject);

router.put('/:id/assign', protect, authorize('admin', 'qualitylead'), assignProject);

module.exports = router;