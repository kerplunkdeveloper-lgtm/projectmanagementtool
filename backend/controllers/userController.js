const User = require('../models/User');
const UserDailyActivity = require('../models/UserDailyActivity');
const { getTodayDateStr } = require('../utils/presenceService');
const bcrypt = require('bcryptjs');




// .....................................................get all user.................................


exports.getUsers = async (req, res) => {
  try {
    let query = {};
    const users = await User.find(query).populate('profile').lean();

    const deptLower = (req.user?.department || '').toLowerCase();
    const isHr =
      deptLower.includes('hr') ||
      deptLower.includes('human resource') ||
      req.user?.department === 'HR' ||
      req.user?.role === 'humanresource';
    const userPerm = req.user?.permissions?.manage_users;
    const canViewPasswords =
      req.user?.role === 'admin' ||
      req.user?.role === 'operationmanager' ||
      isHr ||
      userPerm === true ||
      userPerm?.write === true ||
      userPerm?.read === true ||
      userPerm?.update === true;

    const sanitizedUsers = users.map((u) => {
      if (!canViewPasswords) {
        const { plainPassword, ...rest } = u;
        return rest;
      }
      return u;
    });

    res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      data: sanitizedUsers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};






// .....................................................get user.................................
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('profile').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const deptLower = (req.user?.department || '').toLowerCase();
    const isHr =
      deptLower.includes('hr') ||
      deptLower.includes('human resource') ||
      req.user?.department === 'HR' ||
      req.user?.role === 'humanresource';
    const userPerm = req.user?.permissions?.manage_users;
    const canViewPasswords =
      req.user?.role === 'admin' ||
      req.user?.role === 'operationmanager' ||
      isHr ||
      userPerm === true ||
      userPerm?.write === true ||
      userPerm?.read === true ||
      userPerm?.update === true;

    if (!canViewPasswords && req.user?._id?.toString() !== user._id?.toString()) {
      delete user.plainPassword;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};




// .....................................................create user.................................

exports.createUser = async (req, res) => {
  try {
    // Check permission
    const userPerm = req.user.permissions?.manage_users;
    const canCreateUser =
      req.user.role === 'admin' ||
      req.user.role === 'operationmanager' ||
      userPerm === true ||
      userPerm?.write === true ||
      userPerm?.create === true;

    if (!canCreateUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create users',
      });
    }

    if (req.user.role !== 'admin' && req.body.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create admin accounts',
      });
    }

    const {
      email,
      password,
    } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userData = {
      ...req.body,
      password: hashedPassword,
      plainPassword: password,
    };

    if (userData.role === 'humanresource' && (!userData.department || userData.department.trim() === '')) {
      userData.department = 'HR';
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      data: user,
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};




// .....................................................update user.................................

exports.updateUser = async (req, res) => {
  try {

    const updateData = {
      ...req.body,
    };

    if (updateData.role === 'humanresource' && (!updateData.department || updateData.department.trim() === '')) {
      updateData.department = 'HR';
    }

    // If password exists -> hash password
    if (req.body.password) {

      const salt = await bcrypt.genSalt(10);

      updateData.password = await bcrypt.hash(
        req.body.password,
        salt
      );
      updateData.plainPassword = req.body.password;
    }

    const targetId = (!req.params.id || req.params.id === 'me') ? req.user._id : req.params.id;

    // Security check: non-admins/operationmanagers cannot update other users unless they have manage_users permission
    const userPerm = req.user.permissions?.manage_users;
    const canUpdateUser =
      req.user.role === 'admin' ||
      req.user.role === 'operationmanager' ||
      targetId.toString() === req.user._id.toString() ||
      userPerm === true ||
      userPerm?.update === true ||
      userPerm?.write === true;

    if (!canUpdateUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

    const userToUpdate = await User.findById(targetId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Non-admins cannot update admin users
    if (req.user.role !== 'admin' && userToUpdate.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non-admin users cannot update admin accounts',
      });
    }

    const user = await User.findByIdAndUpdate(
      targetId,
      updateData,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};




// .....................................................delete user.................................

exports.deleteUser = async (req, res) => {
  try {
    console.log("DELETE USER CALLED WITH ID:", req.params.id);

    const userPerm = req.user.permissions?.manage_users;
    const canDeleteUser =
      req.user.role === 'admin' ||
      req.user.role === 'operationmanager' ||
      userPerm === true ||
      userPerm?.delete === true ||
      userPerm?.write === true;

    if (!canDeleteUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users',
      });
    }

    const userToFind = await User.findById(req.params.id);

    if (!userToFind) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Non-admins cannot delete admin users
    if (req.user.role !== 'admin' && userToFind.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// .....................................................relieve user.................................

exports.relieveUser = async (req, res) => {
  try {
    const userPerm = req.user.permissions?.manage_users;
    const canRelieveUser =
      req.user.role === 'admin' ||
      req.user.role === 'operationmanager' ||
      userPerm === true ||
      userPerm?.update === true ||
      userPerm?.write === true;

    if (!canRelieveUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to relieve users',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts cannot be relieved',
      });
    }

    user.employmentStatus = 'relieved';
    user.accountStatus = 'inactive';
    user.relievedAt = new Date();
    user.relievedBy = req.user._id;
    user.relievedReason = req.body.reason || '';
    await user.save();

    // Force logout active session via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id.toString()).emit('account_deactivated', {
        userId: req.params.id,
        message: 'Your account has been deactivated. Please contact your administrator.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User has been successfully relieved.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// .....................................................reactivate user.................................

exports.reactivateUser = async (req, res) => {
  try {
    const userPerm = req.user.permissions?.manage_users;
    const canReactivateUser =
      req.user.role === 'admin' ||
      req.user.role === 'operationmanager' ||
      userPerm === true ||
      userPerm?.update === true ||
      userPerm?.write === true;

    if (!canReactivateUser) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reactivate users',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.employmentStatus = 'active';
    user.accountStatus = 'active';
    user.relievedAt = null;
    user.relievedBy = null;
    user.relievedReason = '';
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'User has been successfully reactivated.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// .....................................................get team active / daily presence status.................................
const formatHoursMins = (ms) => {
  if (!ms || ms <= 0) return '0h 0m';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const classifyUserDepartment = (u) => {
  const role = (u.role || '').toLowerCase();
  const dept = (u.department || '').toLowerCase();
  const name = (u.name || '').toLowerCase();

  // 1. Admin user
  if (role === 'admin' || name.includes('admin')) {
    return {
      categoryId: 'admin',
      categoryName: 'Admin',
      order: 1,
      badgeColor: 'purple',
    };
  }

  // 2. Operation Manager
  if (role === 'operationmanager' || dept.includes('operation') || name.includes('operation')) {
    return {
      categoryId: 'operation_manager',
      categoryName: 'Operation Manager',
      order: 2,
      badgeColor: 'blue',
    };
  }

  // 3. Social Media Manager
  if (dept.includes('social') || dept.includes('media') || dept.includes('smm')) {
    return {
      categoryId: 'social_media_manager',
      categoryName: 'Social Media Manager',
      order: 3,
      badgeColor: 'pink',
    };
  }

  // 4. Graphic Designer
  if (dept.includes('graphic') || dept.includes('design') || dept.includes('ui') || dept.includes('ux')) {
    return {
      categoryId: 'graphic_designer',
      categoryName: 'Graphic Designer',
      order: 4,
      badgeColor: 'amber',
    };
  }

  // 5. Cinematographer
  if (dept.includes('cinema') || dept.includes('video') || dept.includes('edit') || dept.includes('shoot') || dept.includes('camera')) {
    return {
      categoryId: 'cinematographer',
      categoryName: 'Cinematographer',
      order: 5,
      badgeColor: 'emerald',
    };
  }

  // 6. Other departments (e.g. Web Developer, Mobile Developer, Content Writer, SEO, etc.)
  const customDept = u.department && u.department.trim() ? u.department.trim() : 'Other Department';
  return {
    categoryId: 'other_departments',
    categoryName: customDept,
    order: 6,
    badgeColor: 'indigo',
  };
};

exports.getTeamActivity = async (req, res) => {
  try {
    const todayStr = getTodayDateStr(new Date());
    const targetDate = req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : todayStr;
    const isToday = (targetDate === todayStr);

    // Fetch all active users (exclude relieved and inactive employees)
    const rawUsers = await User.find({
      employmentStatus: { $ne: 'relieved' },
      accountStatus: { $ne: 'inactive' },
    })
      .populate('profile')
      .lean();

    // Additional safeguard filter to ensure no relieved user is included
    const users = rawUsers.filter(
      (u) =>
        (u.employmentStatus || '').toLowerCase() !== 'relieved' &&
        (u.accountStatus || '').toLowerCase() !== 'inactive'
    );

    // Fetch daily activity records for target date
    const dailyActivities = await UserDailyActivity.find({ date: targetDate }).lean();
    const activityMap = new Map();
    dailyActivities.forEach((act) => {
      activityMap.set(act.user.toString(), act);
    });

    const onlineUsersMap = req.app.get('onlineUsers') || {};
    const now = new Date();

    let onlineCount = 0;
    let offlineCount = 0;

    const enrichedUsers = users.map((u) => {
      const userIdStr = u._id.toString();
      const inMemoryOnline = Boolean(
        onlineUsersMap[userIdStr] && onlineUsersMap[userIdStr].length > 0
      );
      const isOnline = inMemoryOnline || u.presenceStatus === 'online';

      const activity = activityMap.get(userIdStr);
      let totalOnlineMs = activity?.totalOnlineMs || 0;

      // If user is currently online today, add currently ongoing session duration
      if (isToday && isOnline) {
        let sessionStart = activity?.currentSessionStart
          ? new Date(activity.currentSessionStart)
          : (u.lastActivityAt ? new Date(u.lastActivityAt) : now);
        
        // Guard against future dates or anomalous session starts
        if (sessionStart.getTime() > now.getTime()) {
          sessionStart = now;
        }

        const runningSessionMs = Math.max(0, now.getTime() - sessionStart.getTime());
        totalOnlineMs += runningSessionMs;
      }

      // First seen and last seen calculations
      const firstSeen = activity?.firstLogin || (isOnline ? (u.lastActivityAt || now) : null);
      const lastSeen = activity?.lastSeen || u.lastSeen || (isOnline ? now : null);

      // Offline hours calculation
      let totalOfflineMs = 0;
      let hasLoggedToday = Boolean(activity?.firstLogin || isOnline || (isToday && u.lastSeen && new Date(u.lastSeen).toDateString() === now.toDateString()));

      if (hasLoggedToday && firstSeen) {
        const referenceEnd = isToday ? now : (lastSeen ? new Date(lastSeen) : now);
        const daySpanMs = Math.max(0, referenceEnd.getTime() - new Date(firstSeen).getTime());
        totalOfflineMs = Math.max(0, daySpanMs - totalOnlineMs);
      }

      if (isOnline) {
        onlineCount++;
      } else {
        offlineCount++;
      }

      const classification = classifyUserDepartment(u);

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || classification.categoryName,
        profileImage: u.profile?.profileImage?.url || null,
        employmentStatus: u.employmentStatus,
        accountStatus: u.accountStatus,
        isOnline,
        status: isOnline ? 'online' : 'offline',
        firstSeen,
        lastSeen,
        hasLoggedToday,
        totalOnlineMs,
        totalOfflineMs,
        onlineHoursFormatted: formatHoursMins(totalOnlineMs),
        offlineHoursFormatted: hasLoggedToday ? formatHoursMins(totalOfflineMs) : 'Not Logged In',
        category: classification,
      };
    });

    // Sort users: First by category order (1: Admin, 2: Ops, 3: Social, 4: Graphic, 5: Cinema, 6: Others)
    // Within same category: Online users first, then alphabetically by name
    enrichedUsers.sort((a, b) => {
      if (a.category.order !== b.category.order) {
        return a.category.order - b.category.order;
      }
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Group users by hierarchy categories for instant UI consumption
    const categoryDefinitions = [
      { id: 'admin', label: 'Admin', order: 1, icon: 'shield', color: 'purple' },
      { id: 'operation_manager', label: 'Operation Manager', order: 2, icon: 'briefcase', color: 'blue' },
      { id: 'social_media_manager', label: 'Social Media Manager', order: 3, icon: 'share', color: 'pink' },
      { id: 'graphic_designer', label: 'Graphic Designer', order: 4, icon: 'palette', color: 'amber' },
      { id: 'cinematographer', label: 'Cinematographer', order: 5, icon: 'video', color: 'emerald' },
      { id: 'other_departments', label: 'Other Departments', order: 6, icon: 'layers', color: 'indigo' },
    ];

    const categories = categoryDefinitions.map((cat) => {
      const catUsers = enrichedUsers.filter((u) => u.category.categoryId === cat.id);
      const catOnline = catUsers.filter((u) => u.isOnline).length;
      return {
        ...cat,
        totalCount: catUsers.length,
        onlineCount: catOnline,
        offlineCount: catUsers.length - catOnline,
        users: catUsers,
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate,
      isToday,
      summary: {
        totalUsers: enrichedUsers.length,
        onlineCount,
        offlineCount,
      },
      categories,
      users: enrichedUsers,
    });
  } catch (err) {
    console.error('[GetTeamActivity Error]:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};