import React, { useState, useEffect } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiSlice } from "../../features/api/apiSlice";
import { preloadRoute } from "../../routes/AppRoutes";

import loginBg from "../../assets/login-bg.jpg";
import sorted from "../../assets/sorted.png";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Force pure light mode on login page
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (hadDark) {
      root.classList.remove("dark");
    }

    return () => {
      // Restore user theme preference when navigating away
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        root.classList.add("dark");
      }
    };
  }, []);

  // Preload primary dashboard chunk while user types credentials
  useEffect(() => {
    preloadRoute("/admin");
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Reset any previous user's API cache so new user gets fresh data instantly
    dispatch(apiSlice.util.resetApiState());
    dispatch(loginUser(formData));
  };

  useEffect(() => {
    if (!user) return;
    const roleNorm = (user.role?.name || user.role || "")
      .toString()
      .toLowerCase()
      .replace(/[\s_]+/g, "");

    const deptNorm = (user.department || "").toString().toLowerCase().trim();
    const isSocialMediaHead = 
      deptNorm.includes("social media head") ||
      roleNorm === "socialmediamanager" ||
      roleNorm === "socialmediahead";

    // Came from a Sorted Rooms invite link: continue to Rooms after login
    let pendingRoomCode;
    try {
      pendingRoomCode = sessionStorage.getItem("sortedPendingRoomCode");
    } catch {
      pendingRoomCode = null;
    }
    if (pendingRoomCode) {
      const rolePath =
        roleNorm === "hr"
          ? "humanresource"
          : isSocialMediaHead
            ? "socialmediamanager"
            : roleNorm || "team";
      toast.success("Login Successful");
      navigate(`/${rolePath}/rooms`);
      return;
    }

    if (roleNorm === "admin") {
      toast.success("Admin Login");
      navigate("/admin");
    } else if (roleNorm === "operationmanager") {
      toast.success("Operation Manager Login");
      navigate("/operationmanager");
    } else if (roleNorm === "humanresource" || roleNorm === "hr") {
      toast.success("Human Resource Login");
      navigate("/humanresource");
    } else if (isSocialMediaHead) {
      toast.success("Social Media Manager Login");
      navigate("/socialmediamanager");
    } else {
      toast.success("Login Successful");
      navigate("/team");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end px-4 sm:px-8 md:px-12 lg:pr-16 xl:pr-24 py-8 overflow-x-hidden overflow-y-auto bg-slate-100">
      {/* FULL-SCREEN BACKGROUND IMAGE (DESKTOP & RESPONSIVE) */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(${loginBg})`,
        }}
      />

      {/* MOBILE / TABLET SOFT OVERLAY (Ensures 100% text readability on smaller screens) */}
      <div className="fixed inset-0 bg-gradient-to-r from-white/30 via-white/50 to-white/70 lg:bg-none z-0 pointer-events-none" />

      {/* RIGHT-SIDE FLOATING LOGIN CARD */}
      <div className="relative z-10 w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] border border-white/80 p-7 sm:p-9 md:p-10 transition-all duration-300">
        
        {/* LOGO & HEADER */}
        <div className="flex flex-col items-center mb-7">
          <img
            src={sorted}
            alt="Sorted Logo"
            className="w-[170px] sm:w-[210px] h-auto object-contain mb-3 drop-shadow-sm"
          />
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight text-center">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium text-center mt-1">
            Sign in to manage your tasks & team
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          
          {/* EMAIL INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <div className="flex items-center border border-slate-200/90 rounded-2xl px-4 py-3 sm:py-3.5 bg-slate-50/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500 transition-all shadow-xs">
              <FaEnvelope className="text-slate-400 mr-3 text-base shrink-0" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="w-full !outline-none !bg-transparent !border-none !shadow-none !p-0 text-[14px] text-slate-800 placeholder:text-slate-400 font-semibold"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <div className="flex items-center border border-slate-200/90 rounded-2xl px-4 py-3 sm:py-3.5 bg-slate-50/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500 transition-all shadow-xs">
              <FaLock className="text-slate-400 mr-3 text-base shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Enter your password"
                className="w-full !outline-none !bg-transparent !border-none !shadow-none !p-0 text-[14px] text-slate-800 placeholder:text-slate-400 font-semibold"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-emerald-600 transition-colors ml-2 p-1 cursor-pointer shrink-0"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
              </button>
            </div>
          </div>

          {/* EMERALD GREEN SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="
                relative
                overflow-hidden
                w-full
                h-[50px]
                sm:h-[52px]
                rounded-2xl
                login-btn
                text-[14px]
                font-bold
                tracking-wide
                shadow-lg
                shadow-emerald-500/25
                hover:shadow-emerald-500/40
                hover:scale-[1.01]
                active:scale-[0.98]
                transition-all
                duration-300
                disabled:opacity-70
                disabled:cursor-not-allowed
                cursor-pointer
              "
            >
              {/* SHIMMER EFFECT */}
              <span
                className="
                  absolute
                  inset-0
                  bg-gradient-to-r
                  from-white/0
                  via-white/25
                  to-white/0
                  -translate-x-full
                  hover:translate-x-full
                  transition-transform
                  duration-1000
                "
              />

              {/* BUTTON CONTENT */}
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="relative z-10 font-bold tracking-wide text-white text-[15px]">
                  Sign In
                </span>
              )}
            </button>
          </div>

          {/* FOOTER BADGE */}
          <div className="text-center pt-3">
            <span className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-500 font-semibold text-[11px]">
                  Developed by
                </span>
                <span className="text-emerald-600 font-bold uppercase tracking-wider text-[11px]">
                  Kerplunk Media
                </span>
              </span>
            </span>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;
