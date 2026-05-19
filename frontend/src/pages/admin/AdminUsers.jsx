import React, {
  useEffect,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import toast from "react-hot-toast";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  clearUserError,
} from "../../features/users/userSlice";

import UserHeader from "./users/UserHeader";
import UserTable from "./users/UserTable";
import UserModal from "./users/UserModel";
import DeleteUserModal from "./users/DeleteUserModal";

const USERS_PER_PAGE = 5;

const AdminUsers = () => {

  const dispatch = useDispatch();

  const {
    users,
    loading,
    error,
  } = useSelector(
    (state) => state.users
  );

  const [openModal, setOpenModal] =
    useState(false);

  const [editUser, setEditUser] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterDept, setFilterDept] =
    useState("");

  const [openDeleteModal, setOpenDeleteModal] =
    useState(false);

  const [userToDelete, setUserToDelete] =
    useState(null);



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
  }, [searchTerm, filterDept]);

  // CREATE USER
  const handleCreateUser = async (
    userData
  ) => {
    try {
      await dispatch(
        createUser(userData)
      ).unwrap();

      toast.success(
        "User Created Successfully"
      );

      setOpenModal(false);
    } catch (err) {
      // Handled by global state error listener
    }
  };

  // UPDATE USER
  const handleUpdateUser = async (
    userData
  ) => {
    try {
      await dispatch(
        updateUser({
          id: editUser._id,
          userData,
        })
      ).unwrap();

      toast.success(
        "User Updated Successfully"
      );

      setOpenModal(false);
      setEditUser(null);
    } catch (err) {
      // Handled by global state error listener
    }
  };

  // REQUEST DELETE (OPEN MODAL)
  const requestDeleteUser = (user) => {
    setUserToDelete(user);
    setOpenDeleteModal(true);
  };

  // DELETE USER (FINAL CONFIRMATION)
  const handleDeleteUser = async () => {
    try {
      await dispatch(
        deleteUser(userToDelete._id)
      ).unwrap();

      toast.success(
        "User Deleted Successfully"
      );

      setOpenDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      // Handled by global state error listener
    }
  };

  // FILTER & SORT LOGIC
  const filteredUsers = [...users]
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === "" || user.department === filterDept;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      const roleOrder = { admin: 1, operationmanager: 2, team: 3 };
      return roleOrder[a.role] - roleOrder[b.role];
    });

  // PAGINATION
  const totalPages = Math.ceil(
    filteredUsers.length / USERS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) *
    USERS_PER_PAGE;

  const currentUsers =
    filteredUsers.slice(
      startIndex,
      startIndex + USERS_PER_PAGE
    );

  // COUNT DETAILS
  const totalEntries = filteredUsers.length;
  const startEntry = totalEntries === 0 ? 0 : startIndex + 1;
  const endEntry = Math.min(startIndex + USERS_PER_PAGE, totalEntries);

  return (
    <div className="w-full">

      {/* HEADER */}
      <UserHeader
        setOpenModal={setOpenModal}
        setEditUser={setEditUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
      />

      {/* TABLE */}
      <UserTable
        users={currentUsers}
        loading={loading}
        handleDeleteUser={
          requestDeleteUser
        }
        setOpenModal={setOpenModal}
        setEditUser={setEditUser}
      />

      {/* PAGINATION & COUNT */}
      {totalEntries > 0 && (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-2">
          {/* Count Details */}
          <p className="text-gray-400 text-sm font-medium order-2 md:order-1">
            Showing <span className="text-white">{startEntry}</span> to{" "}
            <span className="text-white">{endEntry}</span> of{" "}
            <span className="text-white">{totalEntries}</span> entries
          </p>

          {/* Pagination Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 order-1 md:order-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-center">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`
                    w-10 h-10
                    rounded-xl
                    font-semibold
                    transition-all
                    flex-shrink-0
                    ${
                      currentPage === index + 1
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      <UserModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleCreateUser={
          handleCreateUser
        }
        handleUpdateUser={
          handleUpdateUser
        }
        editUser={editUser}
        setEditUser={setEditUser}
      />

      {/* DELETE MODAL */}
      <DeleteUserModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        onConfirm={handleDeleteUser}
        user={userToDelete}
      />

    </div>
  );
};

export default AdminUsers;