import React, {
  useState,
  useEffect,
} from "react";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  loginUser,
} from "../../features/auth/authSlice";

import {
  useNavigate,
} from "react-router-dom";

import toast from 'react-hot-toast';



const Login = () => {


  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {
    user,
    loading,
    error,
  } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    dispatch(loginUser(formData));

  };

  useEffect(() => {

    if (user?.role === "admin") {
      toast.success(" Admin Login ");
      navigate("/admin");
    }

    if (user?.role === "operationmanager") {
      toast.success(" Operation Manager Login  ");
      navigate("/operation");
    }

    if (user?.role === "team") {  
      toast.success(" Team Login");
      navigate("/team");
    }

  }, [user, navigate]);




  useEffect(() => {

  if (error) {

    toast.error(error);

  }

}, [error]);




  return (

    <div className="min-h-screen flex items-center justify-center p-4">

      <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT SIDE IMAGE SECTION */}

        <div className="hidden lg:flex relative">

          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1470&auto=format&fit=crop"
            alt="Project Management"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/50 flex flex-col justify-center px-16 text-white">

            <h1 className="text-5xl font-bold leading-tight mb-6">
              Project
              <br />
              Management
              <br />
              Tool
            </h1>

            <p className="text-lg text-gray-200 leading-8">
              Manage projects, teams, tasks and workflows
              with a modern project management platform.
            </p>

          </div>

        </div>

        {/* RIGHT SIDE LOGIN FORM */}

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md"
          >

            <div className="mb-10">

              <h2 className="text-4xl font-bold text-gray-800 mb-3">
                Welcome Back
              </h2>

              <p className="text-gray-500">
                Login to continue managing your projects
              </p>

            </div>

            {/* EMAIL */}

            <div className="mb-5">

              <label className="text-sm font-medium text-gray-600">
                Email Address
              </label>

              <div className="flex items-center border border-gray-300 rounded-xl mt-2 px-4 py-3 focus-within:border-blue-500">

                <FaEnvelope className="text-gray-400 mr-3" />

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  className="w-full outline-none bg-transparent"
                  onChange={handleChange}
                />

              </div>

            </div>

           {/* PASSWORD */}

<div className="mb-6">

  <label className="text-sm font-medium text-gray-600">
    Password
  </label>

  <div className="flex items-center border border-gray-300 rounded-xl mt-2 px-4 py-3 focus-within:border-blue-500">

    <FaLock className="text-gray-400 mr-3" />

    <input
      type={showPassword ? "text" : "password"}
      name="password"
      required
      placeholder="Enter your password"
      className="w-full outline-none bg-transparent"
      onChange={handleChange}
    />

    <button
      type="button"
      onClick={() =>
        setShowPassword(!showPassword)
      }
      className="text-gray-500 text-lg"
    >

      {showPassword ? (
        <FaEyeSlash />
      ) : (
        <FaEye />
      )}

    </button>

  </div>

</div>

          
            {/* BUTTON */}

            <button
              type="submit"
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] transition-all duration-300 text-white py-4 rounded-xl font-semibold text-lg shadow-lg"
            >
              {loading ? "Loading..." : "Login"}
            </button>

            {/* FOOTER */}

            <p className="text-center text-gray-500 mt-8 text-sm">
              © 2026 Project Management Tool
            </p>

          </form>

        </div>

      </div>

    </div>

  );
};

export default Login;