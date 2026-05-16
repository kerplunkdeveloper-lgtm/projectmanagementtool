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
  FiCamera,
  FiMail,
  FiPhone,
  FiMapPin,
  FiSave,
  FiUser,
  FiTrash2,
} from "react-icons/fi";

import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfileImage,
  optimisticProfileUpdate,
} from "../../features/profile/profileSlice";

const Profile = () => {

  const dispatch = useDispatch();

  const { user } = useSelector(
    (state) => state.auth
  );

  const {
    profile,
    loading,
  } = useSelector(
    (state) => state.profile
  );

  const [formData, setFormData] =
    useState({
      bio: "",
      phone: "",
      address: "",
    });

  const [image, setImage] =
    useState(null);

  const [previewImage, setPreviewImage] =
    useState("");



  // GET PROFILE
  useEffect(() => {

    dispatch(getProfile());

  }, [dispatch]);



  // SET FORM DATA
  useEffect(() => {

    if (profile) {

      setFormData({
        bio: profile.bio || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }

  }, [profile]);



  // CLEANUP PREVIEW
  useEffect(() => {

    return () => {

      if (previewImage) {
        URL.revokeObjectURL(
          previewImage
        );
      }
    };

  }, [previewImage]);



  // INPUT CHANGE
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };



  // IMAGE CHANGE
  const handleImageChange = (e) => {

    const file =
      e.target.files[0];

    if (file) {

      setImage(file);

      setPreviewImage(
        URL.createObjectURL(file)
      );
    }
  };



  // DELETE IMAGE
  const handleDeleteImage = () => {
    dispatch(deleteProfileImage());
    setPreviewImage("");
    setImage(null);
  };

  // SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("bio", formData.bio);
    data.append("phone", formData.phone);
    data.append("address", formData.address);

    if (image) {
      data.append("image", image);
    }

    // OPTIMISTIC UPDATE
    const optimisticData = {
      bio: formData.bio,
      phone: formData.phone,
      address: formData.address,
    };

    if (previewImage) {
      optimisticData.profileImage = { url: previewImage };
    }

    dispatch(optimisticProfileUpdate(optimisticData));

    const action = profile ? updateProfile(data) : createProfile(data);

    toast.promise(dispatch(action).unwrap(), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: "Failed to update profile",
    });
  };



  return (

    <div
      className="
        w-full
        max-w-7xl
        mx-auto
      "
    >

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-[380px_1fr]
          gap-6
        "
      >

        {/* LEFT CARD */}
        <div
          className="
            relative
            overflow-hidden

            rounded-[32px]

            bg-gradient-to-b
            from-[#111827]
            via-[#1F2937]
            to-[#0F172A]

            border border-white/10

            shadow-2xl

            p-6 md:p-8
          "
        >

          {/* GLOW */}
          <div
            className="
              absolute
              top-[-50px]
              right-[-50px]

              w-44
              h-44

              rounded-full

              bg-cyan-500/20

              blur-3xl
            "
          />

          <div className="relative z-10">

            {/* IMAGE */}
            <div
              className="
                relative
                w-fit
                mx-auto
              "
            >

              {(previewImage || profile?.profileImage?.url) ? (
                <img
                  src={previewImage || profile?.profileImage?.url}
                  alt="profile"
                  className="
                    w-40
                    h-40
                    rounded-full
                    object-cover
                    border-[5px]
                    border-white/20
                    shadow-2xl
                  "
                />
              ) : (
                <div
                  className="
                    w-40
                    h-40
                    rounded-full
                    border-[5px]
                    border-white/20
                    shadow-2xl
                    bg-gray-800
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiUser size={80} className="text-gray-400" />
                </div>
              )}

              {/* CAMERA BUTTON */}
              <label
                className="
                  absolute
                  bottom-1
                  right-1

                  w-12
                  h-12

                  rounded-full

                  bg-cyan-500

                  flex
                  items-center
                  justify-center

                  text-white

                  cursor-pointer

                  shadow-xl

                  hover:scale-110

                  transition-all
                  duration-300
                "
              >

                <FiCamera size={20} />

                <input
                  type="file"
                  hidden

                  accept="image/*"

                  onChange={
                    handleImageChange
                  }
                />

              </label>

              {/* DELETE BUTTON */}
              {profile?.profileImage?.url && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="
                    absolute
                    bottom-1
                    left-1
                    w-12
                    h-12
                    rounded-full
                    bg-red-500
                    flex
                    items-center
                    justify-center
                    text-white
                    cursor-pointer
                    shadow-xl
                    hover:scale-110
                    transition-all
                    duration-300
                  "
                >
                  <FiTrash2 size={20} />
                </button>
              )}

            </div>

            {/* USER INFO */}
            <div className="mt-8 text-center">

              <h1
                className="
                  text-3xl
                  font-bold
                  text-white
                "
              >
                {user?.name || "User"}
              </h1>

              <p
                className="
                  mt-2

                  uppercase

                  tracking-wider

                  text-cyan-300
                "
              >
                {user?.role || "Team"}
              </p>

            </div>

            {/* INFO BOXES */}
            <div className="mt-10 space-y-4">

              {/* EMAIL */}
              <div
                className="
                  bg-white/5

                  border border-white/10

                  rounded-2xl

                  p-4

                  flex
                  items-center
                  gap-4
                "
              >

                <div
                  className="
                    w-12
                    h-12

                    rounded-xl

                    bg-cyan-500/20

                    flex
                    items-center
                    justify-center

                    text-cyan-400
                  "
                >
                  <FiMail size={20} />
                </div>

                <div>
                  <p
                    className="
                      text-gray-400
                      text-sm
                    "
                  >
                    Email
                  </p>

                  <h3
                    className="
                      text-white
                      text-sm
                    "
                  >
                    {user?.email ||
                      "Not Available"}
                  </h3>

                </div>

              </div>

              {/* PHONE */}
              <div
                className="
                  bg-white/5

                  border border-white/10

                  rounded-2xl

                  p-4

                  flex
                  items-center
                  gap-4
                "
              >

                <div
                  className="
                    w-12
                    h-12

                    rounded-xl

                    bg-green-500/20

                    flex
                    items-center
                    justify-center

                    text-green-400
                  "
                >
                  <FiPhone size={20} />
                </div>

                <div>
                  <p
                    className="
                      text-gray-400
                      text-sm
                    "
                  >
                    Phone
                  </p>

                  <h3
                    className="
                      text-white
                      text-sm
                    "
                  >
                    {
                      formData.phone ||
                      "Not Added"
                    }
                  </h3>

                </div>

              </div>

              {/* ADDRESS */}
              <div
                className="
                  bg-white/5

                  border border-white/10

                  rounded-2xl

                  p-4

                  flex
                  items-center
                  gap-4
                "
              >

                <div
                  className="
                    w-12
                    h-12

                    rounded-xl

                    bg-pink-500/20

                    flex
                    items-center
                    justify-center

                    text-pink-400
                  "
                >
                  <FiMapPin size={20} />
                </div>

                <div>
                  <p
                    className="
                      text-gray-400
                      text-sm
                    "
                  >
                    Address
                  </p>

                  <h3
                    className="
                      text-white
                      text-sm
                    "
                  >
                    {
                      formData.address ||
                      "Not Added"
                    }
                  </h3>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT SECTION */}
        <div
          className="
            rounded-[32px]

            bg-white/10
            backdrop-blur-2xl

            border border-white/10

            shadow-2xl

            p-6 md:p-10
          "
        >

          {/* HEADER */}
          <div className="mb-10">

            <h1
              className="
                text-3xl
                font-bold
                text-white
              "
            >
              Edit Profile
            </h1>

            <p
              className="
                mt-2
                text-gray-400
              "
            >
              Update your personal details
            </p>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >

            {/* BIO */}
            <div>

              <label
                className="
                  text-gray-300
                  mb-3
                  block
                "
              >
                Bio
              </label>

              <textarea
                rows="5"

                name="bio"

                value={formData.bio}

                onChange={handleChange}

                placeholder="Write something about yourself..."

                className="
                  w-full

                  rounded-3xl

                  bg-white/5

                  border border-white/10

                  p-5

                  text-white

                  outline-none

                  focus:border-cyan-400

                  transition-all
                "
              />

            </div>

            {/* GRID */}
            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
              "
            >

              {/* PHONE */}
              <div>

                <label
                  className="
                    text-gray-300
                    mb-3
                    block
                  "
                >
                  Phone Number
                </label>

                <div
                  className="
                    flex
                    items-center

                    rounded-2xl

                    bg-white/5

                    border border-white/10

                    px-4
                  "
                >

                  <FiPhone
                    className="
                      text-cyan-400
                    "
                  />

                  <input
                    type="text"

                    name="phone"

                    value={formData.phone}

                    onChange={handleChange}

                    placeholder="Enter phone"

                    className="
                      w-full

                      bg-transparent

                      p-4

                      text-white

                      outline-none
                    "
                  />

                </div>

              </div>

              {/* ADDRESS */}
              <div>

                <label
                  className="
                    text-gray-300
                    mb-3
                    block
                  "
                >
                  Address
                </label>

                <div
                  className="
                    flex
                    items-center

                    rounded-2xl

                    bg-white/5

                    border border-white/10

                    px-4
                  "
                >

                  <FiMapPin
                    className="
                      text-pink-400
                    "
                  />

                  <input
                    type="text"

                    name="address"

                    value={formData.address}

                    onChange={handleChange}

                    placeholder="Enter address"

                    className="
                      w-full

                      bg-transparent

                      p-4

                      text-white

                      outline-none
                    "
                  />

                </div>

              </div>

            </div>

            {/* EMAIL */}
            <div>

              <label
                className="
                  text-gray-300
                  mb-3
                  block
                "
              >
                Email Address
              </label>

              <div
                className="
                  flex
                  items-center

                  rounded-2xl

                  bg-white/5

                  border border-white/10

                  px-4
                "
              >

                <FiMail
                  className="
                    text-green-400
                  "
                />

                <input
                  type="email"

                  disabled

                  value={
                    user?.email || ""
                  }

                  className="
                    w-full

                    bg-transparent

                    p-4

                    text-gray-400

                    outline-none
                  "
                />

              </div>

            </div>

            {/* BUTTON */}
            <button
              type="submit"

              disabled={loading}

              className="
                w-full

                h-[60px]

                rounded-2xl

                bg-gradient-to-r
                from-cyan-500
                via-blue-600
                to-indigo-600

                text-white
                font-semibold
                text-lg

                flex
                items-center
                justify-center
                gap-3

                shadow-2xl

                hover:scale-[1.01]

                transition-all
                duration-300
              "
            >

              <FiSave size={20} />

              {
                loading
                  ? "Updating..."
                  : "Save Changes"
              }

            </button>

          </form>

        </div>

      </div>

    </div>
  );
};

export default Profile;