import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  useSelector,
  useDispatch,
} from "react-redux";

import {
  logoutUser,
} from "../../features/auth/authSlice";

import {
  getProfile,
} from "../../features/profile/profileSlice";

import {
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import {
  HiOutlineMenuAlt3,
} from "react-icons/hi";

import {
  FiBell,
  FiSearch,
  FiUser,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";

import {
  motion,
  AnimatePresence,
} from "framer-motion";



const Navbar = ({
  setSidebarOpen,
}) => {

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const dropdownRef =
    useRef(null);



  // DROPDOWN
  const [openDropdown,
    setOpenDropdown] =
    useState(false);



  // AUTH
  const { user } = useSelector(
    (state) => state.auth
  );



  // PROFILE
  const {
    profile,
  } = useSelector(
    (state) => state.profile
  );



  // GET PROFILE
  useEffect(() => {

    if (!profile) {

      dispatch(getProfile());
    }

  }, [dispatch, profile]);



  // CLOSE DROPDOWN OUTSIDE CLICK
  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(
            event.target
          )
        ) {

          setOpenDropdown(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);




  // LOGOUT
  const handleLogout =
    async () => {

      await dispatch(
        logoutUser()
      );

      toast.success(
        "Logout Success"
      );

      navigate("/");
    };



  return (

    <motion.div

      initial={{
        y: -40,
        opacity: 0,
      }}

      animate={{
        y: 0,
        opacity: 1,
      }}

      className="
        sticky
        top-0
        z-40

        h-20

        px-4
        md:px-8

        flex
        items-center
        justify-between

        border-b
        border-white/10

        bg-white/5

        backdrop-blur-2xl
      "
    >

      {/* LEFT */}
      <div
        className="
          flex
          items-center
          gap-4
        "
      >

        {/* MENU */}
        <button
          onClick={() =>
            setSidebarOpen(true)
          }

          className="
            lg:hidden

            w-11
            h-11

            rounded-xl

            bg-white/10

            hover:bg-white/20

            flex
            items-center
            justify-center

            transition-all
          "
        >

          <HiOutlineMenuAlt3
            className="
              text-2xl
              text-white
            "
          />

        </button>



        {/* TITLE */}
        <div>

          <h1
            className="
              text-white

              text-xl
              md:text-2xl

              font-bold
            "
          >
            Project Management
          </h1>

        </div>

      </div>



      {/* RIGHT */}
      <div
        className="
          flex
          items-center
          gap-3
          md:gap-5
        "
      >

        {/* SEARCH */}
        <div
          className="
            hidden
            md:flex

            items-center
            gap-3

            px-4

            h-12

            rounded-2xl

            bg-white/10

            border
            border-white/10
          "
        >

          <FiSearch
            className="
              text-gray-300
            "
          />

          <input
            type="text"

            placeholder="Search..."

            className="
              bg-transparent

              outline-none

              text-white

              placeholder:text-gray-400
            "
          />

        </div>



        {/* NOTIFICATION */}
        <button
          className="
            w-11
            h-11

            rounded-2xl

            bg-white/10

            border
            border-white/10

            text-white

            flex
            items-center
            justify-center

            hover:scale-105

            transition-all
          "
        >

          <FiBell />

        </button>



        {/* USER DROPDOWN */}
        <div
          className="
            relative
          "

          ref={dropdownRef}
        >

          {/* USER BUTTON */}
          <button
            onClick={() =>
              setOpenDropdown(
                !openDropdown
              )
            }

            className="
              hidden
              sm:flex

              items-center
              gap-3

              px-4
              py-2

              rounded-2xl

              bg-white/10

              border
              border-white/10

              backdrop-blur-xl

              hover:bg-white/15

              transition-all
            "
          >

            {/* IMAGE */}
            <img
              src={
                profile?.profileImage?.url ||
                "/default-profile.png"
              }

              onError={(e) => {

                e.target.src =
                  "/default-profile.png";
              }}

              alt="profile"

              className="
                w-11
                h-11

                rounded-full

                object-cover

                border-2
                border-cyan-400/40
              "
            />

            {/* INFO */}
            <div
              className="
                text-left
              "
            >

              <h3
                className="
                  text-white
                  font-semibold
                  text-sm
                "
              >
                {user?.name}
              </h3>

              <p
                className="
                  text-xs
                  text-cyan-300
                  capitalize
                "
              >
                {user?.role}
              </p>

            </div>

            {/* ICON */}
            <FiChevronDown
              className={`
                text-white

                transition-transform

                ${openDropdown
                  ? "rotate-180"
                  : ""
                }
              `}
            />

          </button>



          {/* DROPDOWN */}
          <AnimatePresence>

            {openDropdown && (

              <motion.div

                initial={{
                  opacity: 0,
                  y: 10,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

                exit={{
                  opacity: 0,
                  y: 10,
                }}

                className="
                  absolute
                  right-0
                  top-16

                  w-56

                  overflow-hidden

                  rounded-2xl

                  bg-[#111827]

                  border
                  border-white/10

                  shadow-2xl

                  z-50
                "
              >

                {/* PROFILE */}
                <button
  onClick={() => {

    navigate(
      `/${user?.role}/profile`
    );

    setOpenDropdown(false);
  }}

  className="
    w-full

    px-5
    py-4

    flex
    items-center
    gap-3

    text-white

    hover:bg-white/10

    transition-all
  "
>

  <FiUser />

  Edit Profile

</button>



                {/* LOGOUT */}
                <button
                  onClick={
                    handleLogout
                  }

                  className="
                    w-full

                    px-5
                    py-4

                    flex
                    items-center
                    gap-3

                    text-red-400

                    hover:bg-red-500/10

                    transition-all
                  "
                >

                  <FiLogOut />

                  Logout

                </button>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </motion.div>
  );
};

export default Navbar;