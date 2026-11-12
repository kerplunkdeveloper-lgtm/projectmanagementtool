import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { createPortal } from "react-dom";
import { FiUsers, FiX, FiSearch, FiArrowLeft, FiChevronDown } from "react-icons/fi";
import toast from "react-hot-toast";
import { sidebarConfig } from "../../config/sidebarConfig";
import { useSocketContext } from "../../context/SocketContext";
import { markAllChatAsRead } from "../../features/notifications/notificationSlice";
import { clearAllUnreadCounts } from "../../features/chat/chatSlice";
import {
  impersonateUser,
  exitImpersonation,
} from "../../features/auth/authSlice";
import { getUsers } from "../../features/users/userSlice";
import { apiSlice } from "../../features/api/apiSlice";
import { preloadRoute } from "../../routes/AppRoutes";

const HorizontalSidebar = ({ role }) => {
  const { onlineUserIds, isOnline } = useSocketContext() || {
    onlineUserIds: [],
    isOnline: () => false,
  };
  const onlineSet = React.useMemo(() => {
    return new Set((onlineUserIds || []).map((id) => id?.toString()));
  }, [onlineUserIds]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, originalAdminUser } = useSelector(
    (state) => state.auth,
  );
  const { notifications } = useSelector((state) => state.notifications);
  const usersState = useSelector((state) => state.users);
  const users = usersState?.users || [];

  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [activeDropdown]);

  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const [switchSearch, setSwitchSearch] = useState("");
  const [switchCoords, setSwitchCoords] = useState({ top: 0, left: 0 });
  const switchTriggerRef = useRef(null);

  useEffect(() => {
    if (currentUser?.role === "admin" || originalAdminUser) {
      dispatch(getUsers());
    }
  }, [dispatch, currentUser, originalAdminUser]);

  const updateSwitchCoords = () => {
    if (switchTriggerRef.current) {
      const rect = switchTriggerRef.current.getBoundingClientRect();
      const dropdownWidth = 240; // width of user switcher dropdown
      let left = rect.left;
      if (rect.left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, rect.right - dropdownWidth);
      }
      setSwitchCoords({
        top: rect.bottom + 8,
        left: left,
      });
    }
  };

  useEffect(() => {
    if (showSwitchDropdown) {
      updateSwitchCoords();
      window.addEventListener("scroll", updateSwitchCoords, true);
      window.addEventListener("resize", updateSwitchCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateSwitchCoords, true);
      window.removeEventListener("resize", updateSwitchCoords);
    };
  }, [showSwitchDropdown]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        switchTriggerRef.current &&
        !switchTriggerRef.current.contains(e.target) &&
        !e.target.closest(".switch-user-portal")
      ) {
        setShowSwitchDropdown(false);
      }
    };
    if (showSwitchDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showSwitchDropdown]);

  useEffect(() => {
    setShowSwitchDropdown(false);
    setSwitchSearch("");
  }, [location.pathname]);

  const handleSwitchUser = async (userId) => {
    try {
      const result = await dispatch(impersonateUser(userId)).unwrap();
      dispatch(apiSlice.util.resetApiState());
      toast.success("Successfully logged in as user");
      setShowSwitchDropdown(false);
      const targetRole = result.data.user.role;
      const targetDept = (result.data?.user?.department || "").toLowerCase();
      if (targetRole === "admin") {
        window.location.href = "/admin";
      } else if (targetRole === "operationmanager") {
        window.location.href = "/operationmanager";
      } else if (targetRole === "humanresource" || targetRole === "hr") {
        window.location.href = "/humanresource";
      } else if (targetRole === "socialmediamanager" || targetRole === "socialmediahead" || targetDept.includes("social media head")) {
        window.location.href = "/socialmediamanager";
      } else {
        window.location.href = "/team";
      }
    } catch (err) {
      toast.error(err || "Failed to switch user");
    }
  };

  const handleSwitchBackLocal = () => {
    dispatch(exitImpersonation());
    dispatch(apiSlice.util.resetApiState());
    toast.success("Switched back to Admin");
    setShowSwitchDropdown(false);
    window.location.href = "/admin";
  };

  const { unreadCounts = {}, totalUnreadCount: reduxTotalUnread = 0 } = useSelector((state) => state.chat);
  const localUnreadChatCount = Object.values(unreadCounts).reduce(
    (sum, val) => sum + (val || 0),
    0,
  );

  const dbUnreadChatCount = notifications
    ? notifications.filter((n) => !n.isRead && (n.type === "message_received" || n.type === "mention_received"))
      .length
    : 0;

  const totalUnreadChatCount = Math.max(
    localUnreadChatCount,
    dbUnreadChatCount,
    reduxTotalUnread || 0,
  );

  const unreadMomCount = notifications
    ? notifications.filter(
        (n) =>
          !n.isRead &&
          ["mom_created", "mom_assigned", "mom_updated", "mom_overdue"].includes(n.type),
      ).length
    : 0;

  const unreadHrTasksCount = notifications
    ? notifications.filter(
        (n) =>
          !n.isRead &&
          (n.type?.startsWith("hr_task_") ||
            n.hrTask ||
            n.message?.toLowerCase().includes("hr task") ||
            n.message?.toLowerCase().includes("hr department") ||
            (n.sender?.department &&
              (n.sender.department.toLowerCase() === "hr" ||
                n.sender.department.toLowerCase().includes("human resource")) &&
              n.message?.toLowerCase().includes("task"))),
      ).length
    : 0;

  const menuItems = (sidebarConfig[role] || [])
    .map((item) => {
      if (item.children && Array.isArray(item.children)) {
        const visibleChildren = item.children.filter((subItem) => {
          const deptLower = (currentUser?.department || "").toLowerCase();
          const roleLower = (currentUser?.role || role || "").toLowerCase();

          const isAdmin =
            roleLower === "admin" ||
            deptLower.includes("managing partner") ||
            roleLower.includes("managing partner");
          const isOperationManager =
            roleLower === "operationmanager" ||
            deptLower.includes("operation manager") ||
            roleLower.includes("operation manager");

          const isSocialMedia =
            deptLower.includes("social media") ||
            deptLower.includes("social manager") ||
            deptLower.includes("smm") ||
            roleLower.includes("social");

          const isGraphicDesigner =
            !isAdmin &&
            !isOperationManager &&
            !isSocialMedia &&
            (deptLower.includes("graphic") ||
              deptLower.includes("design") ||
              roleLower.includes("graphic") ||
              roleLower.includes("design"));

          const isCinematographer =
            !isAdmin &&
            !isOperationManager &&
            !isSocialMedia &&
            (deptLower.includes("cinema") ||
              deptLower.includes("video") ||
              deptLower.includes("edit") ||
              deptLower.includes("shoot") ||
              deptLower.includes("camera") ||
              roleLower.includes("cinema") ||
              roleLower.includes("video") ||
              roleLower.includes("edit"));

          const isGDOrCinema = isGraphicDesigner || isCinematographer;

          // In Tasks dropdown: Graphic Designers and Cinematographers should ONLY see Assigned Tasks
          if (
            (item.name === "Tasks" || item.path?.includes("/tasks")) &&
            isGDOrCinema
          ) {
            return (
              subItem.name === "Assigned Tasks" ||
              subItem.path?.endsWith("/tasks")
            );
          }

          if (
            subItem.name === "Content Calendar" ||
            subItem.path?.includes("content-calendar")
          ) {
            if (!isSocialMedia && !isAdmin && !isOperationManager) {
              return false;
            }
          }

          if (
            subItem.name === "Calendar" ||
            subItem.path?.includes("event-calendar") ||
            subItem.path?.includes("all-calendar")
          ) {
            const isSocialMediaManager = deptLower.includes("social media");
            if (!isAdmin && !isOperationManager && !isSocialMediaManager) {
              return false;
            }
          }

          if (
            subItem.name === "SM Tasks" ||
            subItem.path?.includes("sm-tasks")
          ) {
            if (!isSocialMedia && !isAdmin && !isOperationManager) {
              return false;
            }
          }


          const isSocialMediaHeadOrManager =
            role === "socialmediamanager" ||
            role === "socialmediahead" ||
            deptLower.includes("social media head") ||
            roleLower.includes("social media manager") ||
            roleLower.includes("social media head");

          if (
            subItem.name === "Designer Tasks" ||
            subItem.path?.includes("designer-tasks")
          ) {
            const isDesigner = deptLower.includes("design") || roleLower.includes("design");
            if (isDesigner || isSocialMediaHeadOrManager) return true;
          }

          if (
            subItem.name === "Cinematographer Tasks" ||
            subItem.path?.includes("cinematographer-tasks")
          ) {
            const isCinema =
              deptLower.includes("cinema") ||
              deptLower.includes("video") ||
              deptLower.includes("edit") ||
              roleLower.includes("cinema");
            if (isCinema || isSocialMediaHeadOrManager) return true;
          }

          if (subItem.permissionKey) {
            if (role === "admin" || role === "operationmanager" || role === "operation manager" || isSocialMediaHeadOrManager) return true;
            if (subItem.permissionKey === "manage_clients") return true;
            const perm = currentUser?.permissions?.[subItem.permissionKey];
            if (perm === true) return true;
            return perm?.read;
          }

          return true;
        });

        return { ...item, children: visibleChildren };
      }
      return item;
    })
    .filter((item) => {
      if (item.children) {
        return item.children.length > 0;
      }

      // Hide My Reports for Social Media Executive department and HR department/role
      if (
        item.name === "My Reports" &&
        (currentUser?.department === "Social Media Manager" ||
          currentUser?.department === "Social Media Executive" ||
          currentUser?.department?.toLowerCase() === "hr" ||
          currentUser?.department?.toLowerCase()?.includes("human resource") ||
          currentUser?.role === "humanresource" ||
          role === "humanresource")
      ) {
        return false;
      }

      // Hide Users for Social Media Head / Manager / Executive
      if (
        (item.name === "Users" ||
          item.path?.includes("/users")) &&
        (role === "socialmediamanager" ||
          role === "socialmediahead" ||
          (currentUser?.department || "").toLowerCase().includes("social media") ||
          (currentUser?.role || "").toLowerCase().includes("social media"))
      ) {
        return false;
      }

      // Hide Clients for HR department/role
      if (
        item.name === "Clients" &&
        (currentUser?.department?.toLowerCase() === "hr" ||
          currentUser?.department?.toLowerCase()?.includes("human resource") ||
          currentUser?.role === "humanresource" ||
          currentUser?.role === "hr" ||
          role === "humanresource" ||
          role === "hr")
      ) {
        return false;
      }

      // Show SM Creditionals ONLY for Social Media Executive department, Managing Partner / Admin, and Operation Manager
      if (
        item.name === "SM Creditionals" ||
        item.name === "SM Credentials" ||
        item.name === "Social Accounts" ||
        item.name?.toLowerCase().includes("sm cred") ||
        item.path?.includes("social-accounts")
      ) {
        const deptLower = (currentUser?.department || "").toLowerCase();
        const roleLower = (currentUser?.role || role || "").toLowerCase();

        const isSocialMedia = deptLower.includes("social media");
        const isManagingPartner =
          roleLower === "admin" ||
          deptLower.includes("managing partner") ||
          roleLower.includes("managing partner");
        const isOperationManager =
          roleLower === "operationmanager" ||
          deptLower.includes("operation manager") ||
          roleLower.includes("operation manager");

        if (!isSocialMedia && !isManagingPartner && !isOperationManager) {
          return false;
        }
      }

      // Show SM Tasks and Content Calendar ONLY for Social Media Executive department, Admin, and Operation Manager
      if (
        item.name === "SM Tasks" ||
        item.name === "Content Calendar" ||
        item.path?.includes("sm-tasks") ||
        item.path?.includes("content-calendar")
      ) {
        const deptLower = (currentUser?.department || "").toLowerCase();
        const roleLower = (currentUser?.role || role || "").toLowerCase();

        const isSocialMedia =
          deptLower.includes("social media") ||
          deptLower.includes("social manager") ||
          deptLower.includes("smm");
        const isAdmin =
          roleLower === "admin" ||
          deptLower.includes("managing partner") ||
          roleLower.includes("managing partner");
        const isOperationManager =
          roleLower === "operationmanager" ||
          deptLower.includes("operation manager") ||
          roleLower.includes("operation manager");

        if (!isSocialMedia && !isAdmin && !isOperationManager) {
          return false;
        }
      }

      // Show Client Calls ONLY for Social Media Executive department
      if (item.name === "Client Calls" || item.path?.includes("client-calls")) {
        const deptLower = (currentUser?.department || "").toLowerCase();
        const isSocialMediaManager = deptLower.includes("social media");

        if (!isSocialMediaManager) {
          return false;
        }
      }

      // Show MOM Points / MOM / Client Calls ONLY for Admin, Operation Manager, and Social Media Executive
      if (
        item.name === "MOM Points" ||
        item.name === "MOM / Client Calls" ||
        item.path?.includes("mom-points")
      ) {
        const deptLower = (currentUser?.department || "").toLowerCase();
        const roleLower = (currentUser?.role || role || "").toLowerCase();

        const isAdmin =
          roleLower === "admin" ||
          deptLower.includes("managing partner") ||
          roleLower.includes("managing partner");
        const isOperationManager =
          roleLower === "operationmanager" ||
          deptLower.includes("operation manager") ||
          roleLower.includes("operation manager");
        const isSocialMediaManager =
          deptLower.includes("social media manager") ||
          deptLower.includes("social manager") ||
          deptLower.includes("social media") ||
          deptLower.includes("social media executive") ||
          roleLower === "socialmediaexecutive" ||
          roleLower === "socialmediamanager";

        if (!isAdmin && !isOperationManager && !isSocialMediaManager) {
          return false;
        }
      }





      // Show Calendar ONLY for Admin, Operation Manager, and Social Media Executive department
      if (item.name === "Calendar" || item.path?.includes("all-calendar")) {
        const deptLower = (currentUser?.department || "").toLowerCase();
        const roleLower = (currentUser?.role || role || "").toLowerCase();

        const isAdmin =
          roleLower === "admin" ||
          deptLower.includes("managing partner") ||
          roleLower.includes("managing partner");
        const isOperationManager =
          roleLower === "operationmanager" ||
          deptLower.includes("operation manager") ||
          roleLower.includes("operation manager");
        const isSocialMediaManager = deptLower.includes("social media");

        if (!isAdmin && !isOperationManager && !isSocialMediaManager) {
          return false;
        }
      }

      // Show Workload ONLY for Admin, Operation Manager, and Social Media Executive department
      if (item.name === "Workload" || item.path?.includes("workload")) {
        const deptLower = (currentUser?.department || "").toLowerCase();
        const roleLower = (currentUser?.role || role || "").toLowerCase();

        const isAdmin =
          roleLower === "admin" ||
          deptLower.includes("managing partner") ||
          roleLower.includes("managing partner");
        const isOperationManager =
          roleLower === "operationmanager" ||
          deptLower.includes("operation manager") ||
          roleLower.includes("operation manager");
        const isSocialMedia =
          deptLower.includes("social media") ||
          deptLower.includes("social manager") ||
          deptLower.includes("smm") ||
          roleLower.includes("social media") ||
          deptLower.includes("social media executive") ||
          roleLower === "socialmediaexecutive" ||
          roleLower === "socialmediamanager";

        if (!isAdmin && !isOperationManager && !isSocialMedia) {
          return false;
        }
      }

      const isSocialMediaHeadOrManager =
        role === "socialmediamanager" ||
        role === "socialmediahead" ||
        (currentUser?.department || "").toLowerCase().includes("social media head") ||
        (currentUser?.role || "").toLowerCase().includes("social media manager");
      if (role === "admin" || role === "operationmanager" || role === "operation manager" || isSocialMediaHeadOrManager) return true;
      if (item.permissionKey === "manage_clients") return true;
      const deptLower = (currentUser?.department || "").toLowerCase();
      const isSocialMedia =
        deptLower.includes("social media") ||
        (currentUser?.role || "").toLowerCase().includes("social");
      if (
        (item.permissionKey === "manage_projects" || item.name === "Projects") &&
        isSocialMedia
      ) {
        return true;
      }
      if (!item.permissionKey) return true;
      const perm = currentUser?.permissions?.[item.permissionKey];
      if (perm === true) return true;
      return perm?.read;
    });

  // filter users (exclude relieved & inactive users)
  const filteredUsers = (users || []).filter((u) => {
    if (!u || !u.name) return false;
    const empStatus = (u.employmentStatus || "").toLowerCase();
    const accStatus = (u.accountStatus || "").toLowerCase();
    const status = (u.status || "").toLowerCase();
    if (
      empStatus === "relieved" ||
      accStatus === "inactive" ||
      status === "relieved"
    ) {
      return false;
    }
    return u.name.toLowerCase().includes(switchSearch.toLowerCase());
  });

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (userObj) => {
    return (
      userObj?.profile?.profileImage?.url ||
      userObj?.profileImage?.url ||
      userObj?.profile?.avatar ||
      userObj?.avatar ||
      ""
    );
  };

  const displayRole = (role) => {
    if (role === "operationmanager") return "Operation Manager";
    if (role === "admin") return "Admin";
    return "Team";
  };

  const safeGetAvatarColor = (name) => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-650",
      "from-purple-500 to-pink-600",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-red-600",
    ];
    if (!name) return colors[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="max-w-7xl mt-3 fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] p-2.5   rounded-full z-40 px-4 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-sm">
      <div className="flex items-center w-full overflow-x-auto px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="flex items-center gap-1.5 mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isChat = item.name.toLowerCase() === "chat";

            if (item.children && item.children.length > 0) {
              const isChildActive = (childPath) => {
                if (!childPath) return false;
                const current = (location.pathname || "").toLowerCase().split("?")[0].replace(/\/+$/, "");
                const target = childPath.toLowerCase().split("?")[0].replace(/\/+$/, "");
                if (current === target) return true;
                if (target.includes("sm-tasks") && current.includes("sm-tasks")) return true;
                if (target.includes("designer-tasks") && current.includes("designer-tasks")) return true;
                if (target.includes("cinematographer-tasks") && current.includes("cinematographer-tasks")) return true;
                if (target.endsWith("/tasks") && current.endsWith("/tasks")) return true;
                if (target.includes("shootcalendor") && current.includes("shootcalendor")) return true;
                if (target.includes("content-calendar") && current.includes("content-calendar")) return true;
                if (target.includes("event-calendar") && current.includes("event-calendar")) return true;
                return false;
              };

              const isAnyChildActive = item.children.some((child) => isChildActive(child.path));
              const isDropdownOpen = activeDropdown === item.name;

              return (
                <div key={item.name} ref={isDropdownOpen ? dropdownRef : null} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown((prev) => (prev === item.name ? null : item.name))}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all group relative cursor-pointer border ${
                      isAnyChildActive
                        ? "sidebar-group-active theme-text-accent shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.name === "Tasks" && unreadHrTasksCount > 0 && (
                      <span className="ml-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-sm shadow-rose-500/30">
                        {unreadHrTasksCount > 99 ? "99+" : unreadHrTasksCount}
                      </span>
                    )}
                    <FiChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 min-w-[190px] bg-white dark:bg-[#151518] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                      {item.children.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = isChildActive(subItem.path);

                        return (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onMouseEnter={() => preloadRoute(subItem.path)}
                            onClick={() => {
                              setActiveDropdown(null);
                              if (subItem.name === "HR Tasks" || subItem.path?.includes("hr-tasks")) {
                                if (notifications) {
                                  notifications.forEach((n) => {
                                    if (
                                      !n.isRead &&
                                      (n.type?.startsWith("hr_task_") ||
                                        n.hrTask ||
                                        n.message?.toLowerCase().includes("hr task") ||
                                        n.message?.toLowerCase().includes("hr department") ||
                                        (n.sender?.department &&
                                          (n.sender.department.toLowerCase() === "hr" ||
                                            n.sender.department.toLowerCase().includes("human resource")) &&
                                          n.message?.toLowerCase().includes("task")))
                                    ) {
                                      dispatch(markAsRead(n._id));
                                    }
                                  });
                                }
                              }
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                              isSubActive
                                ? "sidebar-subitem-active theme-text-accent font-bold"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{subItem.name}</span>
                            {subItem.name === "HR Tasks" && unreadHrTasksCount > 0 && (
                              <span className="ml-auto bg-gradient-to-r from-rose-500 to-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 justify-center animate-pulse shadow-sm shadow-rose-500/30">
                                <span>{unreadHrTasksCount > 99 ? "99+" : unreadHrTasksCount}</span>
                                <span className="text-[6.5px] uppercase tracking-wider">New</span>
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onMouseEnter={() => preloadRoute(item.path)}
                onClick={() => {
                  if (isChat) {
                    dispatch(clearAllUnreadCounts());
                    dispatch(markAllChatAsRead());
                  }
                  if (item.name === "Client Calls" && notifications) {
                    notifications.forEach((n) => {
                      if (!n.isRead && n.type === "client_call_created") {
                        dispatch(markAsRead(n._id));
                      }
                    });
                  }
                  if ((item.name === "MOM Points" || item.name === "MOM / Client Calls") && notifications) {
                    notifications.forEach((n) => {
                      if (!n.isRead && ["mom_created", "mom_assigned", "mom_updated", "mom_overdue"].includes(n.type)) {
                        dispatch(markAsRead(n._id));
                      }
                    });
                  }
                  if ((item.name === "HR Tasks" || item.path?.includes("hr-tasks")) && notifications) {
                    notifications.forEach((n) => {
                      if (
                        !n.isRead &&
                        (n.type?.startsWith("hr_task_") ||
                          n.hrTask ||
                          n.message?.toLowerCase().includes("hr task") ||
                          n.message?.toLowerCase().includes("hr department") ||
                          (n.sender?.department &&
                            (n.sender.department.toLowerCase() === "hr" ||
                              n.sender.department.toLowerCase().includes("human resource")) &&
                            n.message?.toLowerCase().includes("task")))
                      ) {
                        dispatch(markAsRead(n._id));
                      }
                    });
                  }
                }}
                end={item.path === `/${role}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all group relative ${isActive
                    ? "sidebar-item-active theme-text-accent shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-transparent"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
                {isChat && totalUnreadChatCount > 0 && (
                  <span className="ml-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-sm shadow-rose-500/30">
                    {totalUnreadChatCount > 99 ? "99+" : totalUnreadChatCount}
                  </span>
                )}
                {item.name === "Client Calls" &&
                  (notifications
                    ? notifications.filter(
                      (n) =>
                        !n.isRead &&
                        n.type === "client_call_created",
                    ).length
                    : 0) > 0 && (
                    <span className="ml-1 bg-indigo-600 dark:bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      {notifications
                        ? notifications.filter(
                          (n) =>
                            !n.isRead &&
                            n.type === "client_call_created",
                        ).length
                        : 0}
                    </span>
                  )}
                {(item.name === "MOM Points" || item.name === "MOM / Client Calls") && unreadMomCount > 0 && (
                  <span className="ml-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 justify-center animate-pulse shadow-sm">
                    <span>{unreadMomCount > 99 ? "99+" : unreadMomCount}</span>
                    <span className="text-[7.5px] uppercase tracking-wider">New</span>
                  </span>
                )}
                {(item.name === "HR Tasks" || item.path?.includes("hr-tasks")) && unreadHrTasksCount > 0 && (
                  <span className="ml-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 justify-center animate-pulse shadow-sm shadow-rose-500/30">
                    <span>{unreadHrTasksCount > 99 ? "99+" : unreadHrTasksCount}</span>
                    <span className="text-[7px] uppercase tracking-wider">New</span>
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Switch User for Admin / Impersonating Mode */}
          {(currentUser?.role === "admin" || originalAdminUser) && (
            <div className="relative border-l border-slate-200 dark:border-white/10 pl-2">
              <button
                ref={switchTriggerRef}
                type="button"
                onClick={() => setShowSwitchDropdown((prev) => !prev)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all group relative border cursor-pointer ${showSwitchDropdown
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border-transparent"
                  }`}
              >
                <FiUsers className="w-4 h-4 text-indigo-500" />
                <span>Switch User</span>
                {originalAdminUser && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSwitchDropdown &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${switchCoords.top}px`,
              left: `${switchCoords.left}px`,
              zIndex: 999999,
            }}
            className="switch-user-portal w-80 bg-white dark:bg-[#151518] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-3 flex flex-col max-h-[350px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title / Switch back button */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/5 shrink-0">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 tracking-wider uppercase">
                {originalAdminUser ? "Impersonating User" : "Switch User"}
              </span>
              {originalAdminUser && (
                <button
                  type="button"
                  onClick={handleSwitchBackLocal}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-black uppercase cursor-pointer hover:bg-amber-500/20 transition-all"
                >
                  <FiArrowLeft size={10} />
                  Switch Back
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-2 shrink-0">
              <input
                type="text"
                placeholder="Search user..."
                value={switchSearch}
                onChange={(e) => setSwitchSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#111111] text-xs px-2.5 py-1.5 pl-8 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-blue-500 text-slate-700 dark:text-white transition-colors"
                autoFocus
              />
              <FiSearch
                size={11.5}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
              {filteredUsers.map((u) => {
                const isCurrent =
                  u._id === (currentUser?._id || currentUser?.id);
                const uid = (u._id || u.id)?.toString();
                const userIsOnline =
                  onlineSet.has(uid) ||
                  (isOnline && isOnline(uid)) ||
                  u.presenceStatus === "online";
                const avatarUrl = getAvatarUrl(u);
                const dept = u.department || displayRole(u.role);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => {
                      if (!isCurrent) {
                        handleSwitchUser(u._id);
                      }
                    }}
                    disabled={isCurrent}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all text-xs text-left border ${isCurrent
                        ? "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/25 text-indigo-650 dark:text-indigo-400 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-white/5 border-transparent text-slate-750 dark:text-slate-300 cursor-pointer"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200/80 dark:border-white/10"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-gradient-to-br shrink-0 ${safeGetAvatarColor(
                              u.name || "U",
                            )}`}
                          >
                            {getInitials(u.name)}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0b1120] transition-colors ${
                            userIsOnline
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-slate-400 dark:bg-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-xs truncate text-slate-800 dark:text-white">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium capitalize truncate mt-0.5">
                          {dept}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center">
                      {userIsOnline ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                          title="Online"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/60"
                          title="Offline"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="py-6 text-center text-slate-400 dark:text-slate-550 text-xs">
                  No users found.
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default HorizontalSidebar;
