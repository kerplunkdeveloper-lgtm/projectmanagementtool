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
import logo from "../../assets/logo.avif";



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
      navigate("/operationmanager");
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

    <div className="min-h-screen flex items-center justify-center">

      <div className="w-full h-[100vh]  overflow-hidden  grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT SIDE IMAGE SECTION */}

        <div className="hidden lg:flex relative">

          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1470&auto=format&fit=crop"
            alt="Project Management"
            className="w-full h-full object-cover "
          />

           {/* BLUE OVERLAY */}
  <div className="absolute inset-0 bg-blue-500/70"></div>

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

        <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">

          <div>
            <img src={logo} alt=""  className="mb-6 w-[130px] "/>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md"
          >

            <div className="mb-10">

              <h2 className="text-xl font-bold text-center  text-gray-800 mb-3">
                Welcome Back
              </h2>

              <p className="text-gray-500 text-center text-[11px]">
                Login to continue managing your projects
              </p>

            </div>

            {/* EMAIL */}

            <div className="mb-5">

          

              <div className="flex items-center border border-gray-300 rounded-xl mt-2 px-4 py-3 focus-within:border-blue-500">

                <FaEnvelope className="text-gray-400 mr-3" />

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  className="w-full outline-none bg-transparent px-4 p-2"
                  onChange={handleChange}
                />

              </div>  

            </div>

           {/* PASSWORD */}

<div className="mb-6">



  <div className="flex items-center border border-gray-300 rounded-xl mt-2 px-4 py-3 focus-within:border-blue-500">

    <FaLock className="text-gray-400 mr-3" />

    <input
      type={showPassword ? "text" : "password"}
      name="password"
      required
      placeholder="Enter your password"
      className="w-full outline-none bg-transparent px-4 p-2"
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
  disabled={loading}
  className="
    relative
    overflow-hidden

    w-full

    h-[42px]
    lg:h-[46px]

    rounded-xl

    bg-gradient-to-r
    from-blue-600
    via-cyan-500
    to-indigo-600

    hover:from-blue-700
    hover:via-cyan-600
    hover:to-indigo-700

    text-white

    text-[13px]
    lg:text-[14px]

    font-semibold

    shadow-lg
    shadow-blue-200/50

    hover:shadow-blue-300/60

    hover:scale-[1.01]
    active:scale-[0.98]

    transition-all
    duration-300

    disabled:opacity-70
    disabled:cursor-not-allowed
  "
>

  {/* GLOW EFFECT */}
  <span
    className="
      absolute
      inset-0

      bg-gradient-to-r
      from-white/0
      via-white/20
      to-white/0

      -translate-x-full
      hover:translate-x-full

      transition-transform
      duration-1000
    "
  />

  {/* BUTTON TEXT */}
  <span className="relative z-10">
    {loading ? "Loading..." : "Login"}
  </span>

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