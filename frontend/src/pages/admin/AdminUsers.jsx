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

      toast.error(err);

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

      toast.error(err);

    }

  };

  // DELETE USER
  const handleDeleteUser = async (
    id
  ) => {

    try {

      await dispatch(
        deleteUser(id)
      ).unwrap();

      toast.success(
        "User Deleted Successfully"
      );

    } catch (err) {

      toast.error(err);

    }

  };

  // PAGINATION
  const totalPages = Math.ceil(
    users.length / USERS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) *
    USERS_PER_PAGE;

  const currentUsers =
    users.slice(
      startIndex,
      startIndex + USERS_PER_PAGE
    );

  return (
    <div className="w-full">

      {/* HEADER */}
      <UserHeader
        setOpenModal={setOpenModal}
        setEditUser={setEditUser}
      />

      {/* TABLE */}
      <UserTable
        users={currentUsers}
        loading={loading}
        handleDeleteUser={
          handleDeleteUser
        }
        setOpenModal={setOpenModal}
        setEditUser={setEditUser}
      />

      {/* PAGINATION */}
      {totalPages > 1 && (

        <div
          className="
            flex flex-wrap
            items-center
            justify-center
            gap-3
            mt-6
          "
        >

          {[...Array(totalPages)].map(
            (_, index) => (

              <button
                key={index}
                onClick={() =>
                  setCurrentPage(
                    index + 1
                  )
                }
                className={`
                  w-10 h-10
                  rounded-xl
                  font-semibold
                  transition-all

                  ${
                    currentPage ===
                    index + 1
                      ? "bg-cyan-500 text-white"
                      : "bg-white/10 text-gray-300"
                  }
                `}
              >
                {index + 1}
              </button>

            )
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

    </div>
  );
};

export default AdminUsers;