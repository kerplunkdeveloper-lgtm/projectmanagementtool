import React, { useEffect, useState, useCallback } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import toast from "react-hot-toast";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  relieveUser,
  reactivateUser,
  clearUserError,
} from "../../features/users/userSlice";

import { impersonateUser } from "../../features/auth/authSlice";
import { useSocketContext } from "../../context/SocketContext";

import UserHeader from "./users/UserHeader";
import UserTable from "./users/UserTable";
import UserModal from "./users/UserModel";
import DeleteUserModal from "./users/DeleteUserModal";
import PermissionsModal from "./users/PermissionsModal";
import RelieveUserModal from "./users/RelieveUserModal";

const USERS_PER_PAGE = 7;

const AdminUsers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users, loading, error } = useSelector((state) => state.users);

  const { user } = useSelector((state) => state.auth);

  const deptLower = (user?.department || "").toLowerCase();
  const roleLower = (user?.role || "").toLowerCase();
  const isSocialMediaManager =
    roleLower === "socialmediamanager" ||
    roleLower === "socialmediahead" ||
    deptLower.includes("social media head") ||
    location.pathname.includes("/socialmediamanager");

  const isHr =
    roleLower === "humanresource" ||
    roleLower === "hr" ||
    deptLower.includes("hr") ||
    deptLower.includes("human resource");

  const userPerms = user?.permissions?.["manage_users"];
  const canCreate =
    !isSocialMediaManager &&
    (user?.role === "admin" ||
      user?.role === "operationmanager" ||
      userPerms === true ||
      Boolean(userPerms?.write) ||
      Boolean(userPerms?.create));
  const canUpdate =
    !isSocialMediaManager &&
    (user?.role === "admin" ||
      user?.role === "operationmanager" ||
      userPerms === true ||
      Boolean(userPerms?.update) ||
      Boolean(userPerms?.write));
  const canDelete =
    !isSocialMediaManager &&
    (user?.role === "admin" ||
      user?.role === "operationmanager" ||
      userPerms === true ||
      Boolean(userPerms?.delete) ||
      Boolean(userPerms?.write));
  const canWrite = canCreate || canUpdate || canDelete;
  const isReadOnly = isSocialMediaManager || !canWrite;

  const [openModal, setOpenModal] = useState(false);

  const [editUser, setEditUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(
    () => parseInt(localStorage.getItem("adminUsers_currentPage")) || 1,
  );

  // Clear any previously persisted search term from localStorage
  useEffect(() => {
    localStorage.removeItem("adminUsers_searchTerm");
    return () => {
      localStorage.removeItem("adminUsers_searchTerm");
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const [filterDept, setFilterDept] = useState(
    () => localStorage.getItem("adminUsers_filterDept") || "",
  );

  const [filterLocation, setFilterLocation] = useState(
    () => localStorage.getItem("adminUsers_filterLocation") || "",
  );
  const [filterRelieved, setFilterRelieved] = useState(
    () => localStorage.getItem("adminUsers_filterRelieved") || "active",
  );

  useEffect(() => {
    localStorage.setItem("adminUsers_currentPage", currentPage);
    localStorage.setItem("adminUsers_filterDept", filterDept);
    localStorage.setItem("adminUsers_filterLocation", filterLocation);
    localStorage.setItem("adminUsers_filterRelieved", filterRelieved);
  }, [currentPage, filterDept, filterLocation, filterRelieved]);

  // Reset page to 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);

  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);

  const [openRelieveModal, setOpenRelieveModal] = useState(false);
  const [relieveTargetUser, setRelieveTargetUser] = useState(null);
  const [relieveMode, setRelieveMode] = useState("relieve");
  const [relieveLoading, setRelieveLoading] = useState(false);

  // GET USERS
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // ERROR
  useEffect(() => {
    if (error) {
      toast.error(error);

      dispatch(clearUserError());
    }
  }, [error, dispatch]);

  // RESET PAGE ON FILTER
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterDept, filterLocation, filterRelieved]);

  // CREATE USER
  const handleCreateUser = async (userData) => {
    try {
      await dispatch(createUser(userData)).unwrap();

      toast.success("User Created Successfully");

      setOpenModal(false);
      setEditUser(null);
    } catch (err) {
      // Handled by global state error listener
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const targetId = editUser?._id || permissionsUser?._id;
      if (!targetId) return;

      await dispatch(
        updateUser({
          id: targetId,
          userData,
        }),
      ).unwrap();

      toast.success("User Updated Successfully");

      setOpenModal(false);
      setEditUser(null);
      setOpenPermissionsModal(false);
      setPermissionsUser(null);
    } catch (err) {
      // Handled by global state error listener
    }
  };

  // REQUEST DELETE (OPEN MODAL)
  const requestDeleteUser = useCallback((userToDeleteItem) => {
    if (
      userToDeleteItem?.role === "admin" ||
      userToDeleteItem?.role?.toLowerCase() === "admin"
    ) {
      toast.error("Admin user cannot be deleted.");
      return;
    }
    setUserToDelete(userToDeleteItem);
    setOpenDeleteModal(true);
  }, []);

  // DELETE USER (FINAL CONFIRMATION)
  const handleDeleteUser = async () => {
    try {
      await dispatch(deleteUser(userToDelete._id)).unwrap();

      toast.success("User Deleted Successfully");

      setOpenDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      // Handled by global state error listener
    }
  };

  // IMPERSONATE USER
  const handleImpersonate = useCallback(async (userId) => {
    try {
      const result = await dispatch(impersonateUser(userId)).unwrap();
      toast.success("Successfully logged in as user");
      const targetRole = result.data.user.role;
      const targetDept = (result.data?.user?.department || "").toLowerCase();
      if (targetRole === "admin") {
        navigate("/admin");
      } else if (targetRole === "operationmanager") {
        navigate("/operationmanager");
      } else if (targetRole === "humanresource" || targetRole === "hr") {
        navigate("/humanresource");
      } else if (targetRole === "socialmediamanager" || targetRole === "socialmediahead" || targetDept.includes("social media head")) {
        navigate("/socialmediamanager");
      } else {
        navigate("/team");
      }
    } catch (err) {
      toast.error(err || "Failed to impersonate");
    }
  }, [dispatch, navigate]);

  // RELIEVE USER MODAL TRIGGER
  const handleRequestRelieve = useCallback((user) => {
    setRelieveTargetUser(user);
    setRelieveMode("relieve");
    setOpenRelieveModal(true);
  }, []);

  // REACTIVATE USER MODAL TRIGGER
  const handleRequestReactivate = useCallback((user) => {
    setRelieveTargetUser(user);
    setRelieveMode("reactivate");
    setOpenRelieveModal(true);
  }, []);

  // CONFIRM RELIEVE / REACTIVATE
  const handleConfirmRelieve = async (user, reason) => {
    setRelieveLoading(true);
    try {
      if (relieveMode === "relieve") {
        await dispatch(relieveUser({ id: user._id, reason })).unwrap();
        toast.success("User has been successfully relieved.");
      } else {
        await dispatch(reactivateUser(user._id)).unwrap();
        toast.success("User has been successfully reactivated.");
      }
      setOpenRelieveModal(false);
      setRelieveTargetUser(null);
    } catch (err) {
      toast.error(err || "Action failed");
    } finally {
      setRelieveLoading(false);
    }
  };

  // FILTER & SORT LOGIC
  const filteredUsers = React.useMemo(() => {
    return [...(users || [])]
      .filter((user) => {
        if (!user) return false;
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch =
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.location && user.location.toLowerCase().includes(searchLower));
        const matchesDept =
          filterDept === "" ||
          user.department === filterDept ||
          ((filterDept === "Social Media Executive" || filterDept === "Social Media Manager") &&
            (user.department === "Social Media Executive" || user.department === "Social Media Manager"));
        const matchesLoc =
          filterLocation === "" || user.location === filterLocation;

        let matchesRelieved = true;
        const isRelieved =
          user.employmentStatus === "relieved" ||
          user.accountStatus === "inactive";
        if (filterRelieved === "active") matchesRelieved = !isRelieved;
        else if (filterRelieved === "relieved") matchesRelieved = isRelieved;

        return matchesSearch && matchesDept && matchesLoc && matchesRelieved;
      })
      .sort((a, b) => {
        const getUserPriority = (u) => {
          const dept = (u.department || "").toLowerCase().trim();
          const role = (u.role || "").toLowerCase().trim();
          if (
            role === "humanresource" ||
            role === "hr" ||
            dept === "hr" ||
            dept.includes("human resource")
          )
            return 1;
          if (role === "admin" || dept === "admin" || dept.includes("managing partner"))
            return 2;
          if (
            role === "operationmanager" ||
            role === "operation manager" ||
            dept.includes("operation manager") ||
            dept === "operations manager"
          )
            return 3;
          if (dept.includes("social media head") || dept.includes("smm head"))
            return 4;
          if (
            dept.includes("social media executive") ||
            dept.includes("social media manager") ||
            dept.includes("social media") ||
            role === "socialmediamanager" ||
            role === "socialmediaexecutive"
          )
            return 5;
          return 100;
        };

        const pA = getUserPriority(a);
        const pB = getUserPriority(b);
        if (pA !== pB) return pA - pB;

        const deptA = a.department || "ZZZ";
        const deptB = b.department || "ZZZ";

        if (deptA !== deptB) {
          return deptA.localeCompare(deptB);
        }

        return (a.name || "").localeCompare(b.name || "");
      });
  }, [users, debouncedSearchTerm, filterDept, filterLocation, filterRelieved]);

  // PAGINATION
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * USERS_PER_PAGE;

  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + USERS_PER_PAGE,
  );

  // COUNT DETAILS
  const totalEntries = filteredUsers.length;
  const startEntry = totalEntries === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + USERS_PER_PAGE, totalEntries);

  const { onlineUserIds, isOnline } = useSocketContext() || {
    onlineUserIds: [],
    isOnline: () => false,
  };

  const checkUserOnline = (u) => {
    if (!u) return false;
    const uid = (u._id || u.id)?.toString();
    if (!uid) return false;
    if (isOnline && isOnline(uid)) return true;
    if (onlineUserIds && onlineUserIds.some((id) => id.toString() === uid))
      return true;
    return u.presenceStatus === "online";
  };

  // EXCEL EXPORT HANDLER
  const handleExportExcel = () => {
    const dataToExport = filteredUsers;

    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No users found to export");
      return;
    }

    const headers = [
      "User Name",
      "Email Address",
      "Password",
      "Phone Number",
      "Role",
      "Department",
      "Location",
      "Employment Status",
      "Presence",
      "Joined Date",
      "Relieved Date",
      "Relieve Reason",
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = dataToExport.map((u) => {
      const roleMap = {
        admin: "Admin",
        operationmanager: "Operations Manager",
        humanresource: "Human Resource",
        team: "Team Member",
      };
      const roleStr = roleMap[u.role] || u.role || "Team Member";

      const isRelieved =
        u.employmentStatus === "relieved" || u.accountStatus === "inactive";
      const empStatusStr = isRelieved ? "Relieved" : "Active";

      const online = checkUserOnline(u);
      const presenceStr = isRelieved
        ? "Relieved"
        : online
          ? "Online"
          : "Offline";

      const phoneStr = u.profile?.phone || "-";

      const joinedDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "-";

      const relievedDate = u.relievedAt
        ? new Date(u.relievedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "-";

      const relieveReason = u.relieveReason || "-";

      return [
        escapeCsv(u.name || "-"),
        escapeCsv(u.email || "-"),
        escapeCsv(
          isHr && (u.role === "admin" || u.role?.toLowerCase() === "admin")
            ? "-"
            : u.plainPassword || "-",
        ),
        escapeCsv(phoneStr),
        escapeCsv(roleStr),
        escapeCsv(u.department || "-"),
        escapeCsv(u.location || "-"),
        escapeCsv(empStatusStr),
        escapeCsv(presenceStr),
        escapeCsv(joinedDate),
        escapeCsv(relievedDate),
        escapeCsv(relieveReason),
      ].join(",");
    });

    const csvContent =
      "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filterTag = filterDept
      ? `_${filterDept.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "";
    const todayStr = new Date().toISOString().split("T")[0];
    const fileName = `Users_List${filterTag}_${todayStr}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} users to Excel!`);
  };

  return (
    <div className="w-full">
      {/* HEADER */}
      <UserHeader
        users={users}
        setOpenModal={setOpenModal}
        setEditUser={setEditUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        filterRelieved={filterRelieved}
        setFilterRelieved={setFilterRelieved}
        isReadOnly={isReadOnly}
        canCreate={canCreate}
        onExportExcel={handleExportExcel}
      />

      <UserTable
        users={currentUsers}
        loading={loading}
        handleDeleteUser={requestDeleteUser}
        handleRequestRelieve={handleRequestRelieve}
        handleRequestReactivate={handleRequestReactivate}
        setOpenModal={setOpenModal}
        setEditUser={setEditUser}
        handleImpersonate={handleImpersonate}
        isReadOnly={isReadOnly}
        setOpenPermissionsModal={setOpenPermissionsModal}
        setPermissionsUser={setPermissionsUser}
      />

      {/* PAGINATION & COUNT */}
      {totalEntries > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-1 sm:px-2">
          {/* Count Details */}
          <p className="theme-text-secondary text-xs sm:text-[13px] font-medium order-2 sm:order-1 text-center sm:text-left">
            Showing{" "}
            <span className="theme-text-primary font-semibold">
              {startEntry}
            </span>{" "}
            to{" "}
            <span className="theme-text-primary font-semibold">{endEntry}</span>{" "}
            of{" "}
            <span className="theme-text-primary font-semibold">
              {totalEntries}
            </span>{" "}
            entries
          </p>

          {/* Pagination Buttons */}
          {totalPages > 1 && (() => {
            const getPages = () => {
              if (totalPages <= 7) {
                return Array.from({ length: totalPages }, (_, i) => i + 1);
              }
              if (currentPage <= 3) {
                return [1, 2, 3, 4, "...", totalPages];
              }
              if (currentPage >= totalPages - 2) {
                return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
              }
              return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
            };
            const pages = getPages();

            return (
              <div className="flex items-center gap-1.5 order-1 sm:order-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Previous page"
                >
                  <FiChevronLeft size={15} />
                </button>

                {pages.map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`dots-${idx}`}
                      className="w-6 text-center text-xs font-bold text-slate-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`
                        w-8 h-8
                        rounded-xl
                        font-bold
                        text-xs
                        transition-all
                        flex-shrink-0
                        cursor-pointer
                        ${
                          currentPage === item
                            ? "dashboard-btn-primary shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                        }
                      `}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Next page"
                >
                  <FiChevronRight size={15} />
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL */}
      <UserModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleCreateUser={handleCreateUser}
        handleUpdateUser={handleUpdateUser}
        editUser={editUser}
        setEditUser={setEditUser}
        users={users}
      />

      {/* DELETE MODAL */}
      <DeleteUserModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        onConfirm={handleDeleteUser}
        user={userToDelete}
      />

      {/* RELIEVE / REACTIVATE MODAL */}
      <RelieveUserModal
        open={openRelieveModal}
        setOpen={setOpenRelieveModal}
        onConfirm={handleConfirmRelieve}
        user={relieveTargetUser}
        mode={relieveMode}
        loading={relieveLoading}
      />

      {/* PERMISSIONS MODAL */}
      <PermissionsModal
        open={openPermissionsModal}
        setOpen={setOpenPermissionsModal}
        user={permissionsUser}
        handleUpdateUser={(permissions) => handleUpdateUser({ permissions })}
      />
    </div>
  );
};

export default AdminUsers;
