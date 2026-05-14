const express = require('express');
const {
  getMyProfile,
  updateProfile,
  deleteProfile,
  getProfiles,
  getProfile,
} = require('../controllers/profileController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, getMyProfile);
router.put('/', protect, updateProfile);
router.delete('/', protect, deleteProfile);

router.get('/', protect, authorize('admin'), getProfiles);
router.get('/:id', protect, authorize('admin'), getProfile);

module.exports = router;