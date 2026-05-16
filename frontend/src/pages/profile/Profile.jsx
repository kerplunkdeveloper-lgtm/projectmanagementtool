import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

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

  const { user } = useSelector((state) => state.auth);

  const { profile, loading } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    bio: "",
    phone: "",
    address: "",
  });

  const [image, setImage] = useState(null);

  const [previewImage, setPreviewImage] = useState("");

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

  // CLEANUP
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // INPUT CHANGE
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // IMAGE CHANGE
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);

      setPreviewImage(URL.createObjectURL(file));
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
      optimisticData.profileImage = {
        url: previewImage,
      };
    }

    dispatch(optimisticProfileUpdate(optimisticData));

    const action = profile
      ? updateProfile(data)
      : createProfile(data);

    toast.promise(dispatch(action).unwrap(), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: "Failed to update profile",
    });
  };

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-50
        via-white
        to-gray-100

        px-4
        sm:px-6
        lg:px-10

        py-6
        md:py-10
      "
    >
      <div
        className="
          max-w-8xl
          mx-auto
        "
      >
        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[380px_1fr]
            gap-6
            lg:gap-8
          "
        >
          {/* LEFT CARD */}
          <div
            className="
              relative
              overflow-hidden

              rounded-[32px]

              bg-white/90
              backdrop-blur-xl

              border
              border-gray-200

              shadow-[0_20px_60px_rgba(15,23,42,0.08)]

              p-6
              sm:p-8
            "
          >
            {/* PREMIUM GLOW */}
            <div
              className="
                absolute
                -top-20
                -right-20

                w-72
                h-72

                rounded-full

                bg-blue-100

                blur-3xl
              "
            />

            <div
              className="
                absolute
                bottom-0
                left-0

                w-56
                h-56

                rounded-full

                bg-cyan-100

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
                {previewImage || profile?.profileImage?.url ? (
                  <img
                    src={
                      previewImage ||
                      profile?.profileImage?.url
                    }
                    alt="profile"
                    className="
                      w-36
                      h-36

                      sm:w-44
                      sm:h-44

                      rounded-full
                      object-cover

                      border-[6px]
                      border-white

                      shadow-[0_15px_40px_rgba(0,0,0,0.12)]
                    "
                  />
                ) : (
                  <div
                    className="
                      w-36
                      h-36

                      sm:w-44
                      sm:h-44

                      rounded-full

                      bg-gradient-to-br
                      from-slate-100
                      to-slate-200

                      border-[6px]
                      border-white

                      flex
                      items-center
                      justify-center

                      shadow-[0_15px_40px_rgba(0,0,0,0.08)]
                    "
                  >
                    <FiUser
                      size={70}
                      className="text-slate-500"
                    />
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

                    bg-gradient-to-r
                    from-blue-500
                    to-cyan-500

                    flex
                    items-center
                    justify-center

                    text-white

                    cursor-pointer

                    shadow-xl

                    hover:scale-110
                    hover:rotate-6

                    transition-all
                    duration-300
                  "
                >
                  <FiCamera size={20} />

                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
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

                      bg-gradient-to-r
                      from-red-500
                      to-pink-500

                      flex
                      items-center
                      justify-center

                      text-white

                      shadow-xl

                      hover:scale-110

                      transition-all
                      duration-300
                    "
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
              </div>

              {/* USER INFO */}
              <div className="mt-8 text-center">
                <h1
                  className="
                    text-2xl
                    sm:text-3xl

                    font-bold

                    text-slate-800
                  "
                >
                  {user?.name || "User"}
                </h1>

                <p
                  className="
                    mt-2

                    inline-flex
                    items-center
                    justify-center

                    px-4
                    py-1.5

                    rounded-full

                    bg-blue-50

                    text-blue-600
                    text-sm
                    font-semibold
                    uppercase
                    tracking-wider
                  "
                >
                  {user?.role || "Team"}
                </p>
              </div>

              {/* INFO CARDS */}
              <div className="mt-10 space-y-4">
                {/* EMAIL */}
                <div
                  className="
                    bg-white

                    border
                    border-gray-200

                    rounded-3xl

                    p-4

                    flex
                    items-center
                    gap-4

                    shadow-sm

                    hover:shadow-lg
                    hover:-translate-y-1

                    transition-all
                    duration-300
                  "
                >
                  <div
                    className="
                      w-14
                      h-14

                      rounded-2xl

                      bg-blue-50

                      flex
                      items-center
                      justify-center

                      text-blue-600
                    "
                  >
                    <FiMail size={22} />
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <p
                      className="
                        text-gray-500
                        text-sm
                      "
                    >
                      Email
                    </p>

                    <h3
                      className="
                        text-slate-800
                        font-semibold
                        truncate
                      "
                    >
                      {user?.email || "Not Available"}
                    </h3>
                  </div>
                </div>

                {/* PHONE */}
                <div
                  className="
                    bg-white

                    border
                    border-gray-200

                    rounded-3xl

                    p-4

                    flex
                    items-center
                    gap-4

                    shadow-sm

                    hover:shadow-lg
                    hover:-translate-y-1

                    transition-all
                    duration-300
                  "
                >
                  <div
                    className="
                      w-14
                      h-14

                      rounded-2xl

                      bg-emerald-50

                      flex
                      items-center
                      justify-center

                      text-emerald-600
                    "
                  >
                    <FiPhone size={22} />
                  </div>

                  <div>
                    <p
                      className="
                        text-gray-500
                        text-sm
                      "
                    >
                      Phone
                    </p>

                    <h3
                      className="
                        text-slate-800
                        font-semibold
                      "
                    >
                      {formData.phone || "Not Added"}
                    </h3>
                  </div>
                </div>

                {/* ADDRESS */}
                <div
                  className="
                    bg-white

                    border
                    border-gray-200

                    rounded-3xl

                    p-4

                    flex
                    items-center
                    gap-4

                    shadow-sm

                    hover:shadow-lg
                    hover:-translate-y-1

                    transition-all
                    duration-300
                  "
                >
                  <div
                    className="
                      w-14
                      h-14

                      rounded-2xl

                      bg-pink-50

                      flex
                      items-center
                      justify-center

                      text-pink-600
                    "
                  >
                    <FiMapPin size={22} />
                  </div>

                  <div>
                    <p
                      className="
                        text-gray-500
                        text-sm
                      "
                    >
                      Address
                    </p>

                    <h3
                      className="
                        text-slate-800
                        font-semibold
                      "
                    >
                      {formData.address || "Not Added"}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div
            className="
              relative
              overflow-hidden

              rounded-[32px]

              bg-white/90
              backdrop-blur-xl

              border
              border-gray-200

              shadow-[0_20px_60px_rgba(15,23,42,0.08)]

              p-5
              sm:p-8
              lg:p-10
            "
          >
            {/* BG EFFECT */}
            <div
              className="
                absolute
                top-0
                right-0

                w-80
                h-80

                rounded-full

                bg-sky-100

                blur-3xl

                opacity-70
              "
            />

            <div className="relative z-10">
              {/* HEADER */}
              <div className="mb-10">
                <h1
                  className="
                    text-3xl
                    sm:text-4xl

                    font-bold

                    text-slate-800
                  "
                >
                  Edit Profile
                </h1>

                <p
                  className="
                    mt-3

                    text-gray-500
                    text-base
                  "
                >
                  Update your personal information
                  with premium profile settings.
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
                      mb-3
                      block

                      text-sm
                      font-semibold

                      text-slate-700
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

                      bg-slate-50

                      border
                      border-gray-200

                      p-5

                      text-slate-700

                      outline-none

                      focus:border-blue-400
                      focus:ring-4
                      focus:ring-blue-100

                      transition-all
                      duration-300
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
                        mb-3
                        block

                        text-sm
                        font-semibold

                        text-slate-700
                      "
                    >
                      Phone Number
                    </label>

                    <div
                      className="
                        flex
                        items-center
                        gap-3

                        rounded-2xl

                        bg-slate-50

                        border
                        border-gray-200

                        px-4

                        focus-within:border-blue-400
                        focus-within:ring-4
                        focus-within:ring-blue-100

                        transition-all
                      "
                    >
                      <FiPhone
                        className="
                          text-blue-500
                        "
                      />

                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="
                          w-full

                          bg-transparent

                          py-4

                          text-slate-700

                          outline-none
                        "
                      />
                    </div>
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <label
                      className="
                        mb-3
                        block

                        text-sm
                        font-semibold

                        text-slate-700
                      "
                    >
                      Address
                    </label>

                    <div
                      className="
                        flex
                        items-center
                        gap-3

                        rounded-2xl

                        bg-slate-50

                        border
                        border-gray-200

                        px-4

                        focus-within:border-pink-400
                        focus-within:ring-4
                        focus-within:ring-pink-100

                        transition-all
                      "
                    >
                      <FiMapPin
                        className="
                          text-pink-500
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

                          py-4

                          text-slate-700

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
                      mb-3
                      block

                      text-sm
                      font-semibold

                      text-slate-700
                    "
                  >
                    Email Address
                  </label>

                  <div
                    className="
                      flex
                      items-center
                      gap-3

                      rounded-2xl

                      bg-slate-100

                      border
                      border-gray-200

                      px-4
                    "
                  >
                    <FiMail
                      className="
                        text-emerald-500
                      "
                    />

                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="
                        w-full

                        bg-transparent

                        py-4

                        text-slate-500

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
                    relative

                    w-full

                    h-[60px]

                    rounded-2xl

                    overflow-hidden

                    bg-gradient-to-r
                    from-blue-600
                    via-cyan-500
                    to-sky-500

                    text-white
                    font-semibold
                    text-lg

                    flex
                    items-center
                    justify-center
                    gap-3

                    shadow-[0_15px_35px_rgba(59,130,246,0.35)]

                    hover:scale-[1.01]
                    hover:shadow-[0_20px_45px_rgba(59,130,246,0.45)]

                    active:scale-[0.99]

                    transition-all
                    duration-300
                  "
                >
                  <div
                    className="
                      absolute
                      inset-0

                      bg-white/10

                      opacity-0
                      hover:opacity-100

                      transition-all
                    "
                  />

                  <FiSave size={20} />

                  {loading
                    ? "Updating..."
                    : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;