const express = require('express');

const {
  getUsers,
  getUser,
  getTeamActivity,
  createUser,
  updateUser,
  deleteUser,
  relieveUser,
  reactivateUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();


// READ - All roles
router.get(
  '/',
  protect,
  authorize('admin', 'operationmanager', 'team'),
  getUsers
);

router.get(
  '/team-activity',
  protect,
  (req, res, next) => {
    const deptLower = (req.user?.department || '').toLowerCase();
    const isHr =
      deptLower.includes('hr') ||
      deptLower.includes('human resource') ||
      req.user?.department === 'HR';
    const userPerm = req.user?.permissions?.manage_users;
    const hasUsersPerm = userPerm === true || userPerm?.read || userPerm?.write;

    if (
      req.user?.role === 'admin' ||
      req.user?.role === 'operationmanager' ||
      isHr ||
      hasUsersPerm
    ) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view team activity',
    });
  },
  getTeamActivity
);

router.get(
  '/:id',
  protect,
  authorize('admin', 'operationmanager', 'team'),
  getUser
);


// CREATE - Admin only
router.post(
  '/',
  protect,
  authorize('admin', 'operationmanager'),
  createUser
);


// UPDATE CURRENT USER PREFERENCES
router.put(
  '/me',
  protect,
  updateUser
);

// RELIEVE USER - Admin only
router.put(
  '/:id/relieve',
  protect,
  authorize('admin', 'operationmanager'),
  relieveUser
);

// REACTIVATE USER - Admin only
router.put(
  '/:id/reactivate',
  protect,
  authorize('admin', 'operationmanager'),
  reactivateUser
);

// UPDATE - Admin only
router.put(
  '/:id',
  protect,
  authorize('admin', 'operationmanager'),
  updateUser
);


// DELETE - Admin only
router.delete(
  '/:id',
  protect,
  authorize('admin', 'operationmanager'),
  deleteUser
);

module.exports = router;