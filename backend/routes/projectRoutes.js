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
  .post(protect, authorize('admin', 'operationmanager'), createProject);

router
  .route('/:id')
  .get(protect, getProject)
  .put(protect, authorize('admin', 'operationmanager'), updateProject)
  .delete(protect, authorize('admin', 'operationmanager'), deleteProject);

router.put('/:id/assign', protect, authorize('admin', 'operationmanager'), assignProject);

module.exports = router;