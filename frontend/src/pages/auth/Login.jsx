import React, { useState, useEffect } from "react";

import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";

import { loginUser, clearError } from "../../features/auth/authSlice";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";
import { apiSlice } from "../../features/api/apiSlice";
import { preloadRoute } from "../../routes/AppRoutes";

import lightlogin from "../../assets/logol.png";
import darklogo from "../../assets/darklogo.png";
import sorted from "../../assets/sorted.png";
import darksorted from "../../assets/darksorted.png";

const Login = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { user, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

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

    if (roleNorm === "admin") {
      toast.success("Admin Login");
      navigate("/admin");
    } else if (roleNorm === "operationmanager") {
      toast.success("Operation Manager Login");
      navigate("/operationmanager");
    } else if (roleNorm === "humanresource" || roleNorm === "hr") {
      toast.success("Human Resource Login");
      navigate("/humanresource");
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
    <div className="min-h-screen theme-bg-main flex flex-col md:flex-row overflow-hidden">
      {/* TOP / LEFT SIDE IMAGE SECTION WITH ATTRACTIVE GLASS EFFECT & ACTIVE ACCENT COLOR */}
      <div
        id="login-image-section"
        className="relative hidden md:flex w-full md:h-screen md:w-[60%] lg:w-[65%] xl:w-[68%] overflow-hidden items-center justify-center shrink-0 z-0 p-6 lg:p-10"
        style={{
          background: "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent-color) 12%, transparent), transparent 70%)",
        }}
      >
        {/* Dynamic Glowing Ambient Blobs with Settings Active Accent Color */}
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-30 animate-pulse"
          style={{ background: "var(--accent-color)" }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-30 dark:opacity-25"
          style={{ background: "var(--color-incomplete-start, var(--accent-color))" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full blur-[130px] pointer-events-none opacity-20 dark:opacity-25"
          style={{ background: "var(--accent-color)" }}
        />

        {/* Decorative Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Stunning Glass Showcase Container */}
        <div
          className="relative z-10 w-full h-full max-h-[92vh] rounded-[2.5rem] p-4 lg:p-6 flex items-center justify-center overflow-hidden border backdrop-blur-2xl transition-all duration-300 group bg-white/45 dark:bg-slate-900/40 border-white/60 dark:border-white/10"
          style={{
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 10px 40px -10px var(--btn-glow-shadow)",
          }}
        >
          {/* Top-edge Specular Sheen */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

          {/* Floating Glass Pill: Settings Active Theme Accent Indicator */}
          <div className="absolute top-6 left-6 z-20 hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 shadow-lg shadow-black/5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ background: "var(--accent-color)" }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{ background: "var(--accent-color)" }}
            />
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-800 dark:text-slate-200 ml-1">
              Smart Workspace
            </span>
          </div>

          {/* Floating Glass Metric Badge */}
          <div className="absolute bottom-6 right-6 z-20 hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 shadow-xl shadow-black/10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md"
              style={{ background: "var(--color-brand-gradient)" }}
            >
              ✓
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">
                All Systems Operational
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                Sorted Productivity Suite
              </span>
            </div>
          </div>

          {/* The Showcase Images (Light & Dark) */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
            <img
              src={lightlogin}
              alt="Project Management Showcase"
              className="w-full h-full object-contain dark:hidden transition-transform duration-700 ease-out group-hover:scale-[1.02] drop-shadow-xl"
            />
            <img
              src={darklogo}
              alt="Project Management Showcase Dark"
              className="w-full h-full object-contain hidden dark:block transition-transform duration-700 ease-out group-hover:scale-[1.02] drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>
      </div>

      {/* BOTTOM / RIGHT SIDE LOGIN FORM */}
      <div
        id="login-form-section"
        className="w-full md:w-[40%] lg:w-[35%] xl:w-[32%] min-h-screen md:h-screen flex flex-col justify-center p-4 sm:p-12 md:px-8 lg:px-12 xl:px-16 relative z-10 backdrop-blur-xl"
      >
        <div className="w-full max-w-[490px] mx-auto relative z-10  md:bg-transparent md:dark:bg-transparent p-8 sm:p-10 md:p-0 rounded-[2rem] md:rounded-none shadow-2xl md:shadow-none border border-slate-100 dark:border-slate-800 md:border-none">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex justify-center md:justify-start mb-10 md:mb-12">
              <img src={sorted} alt="Sorted Logo" className="w-[180px] md:w-[300px] h-auto object-contain dark:hidden" />
              <img src={darksorted} alt="Sorted Logo" className="w-[180px] md:w-[300px] h-auto object-contain hidden dark:block" />
            </div>


            {/* EMAIL */}
            <div className="mb-5">
              <div className="flex items-center border theme-border rounded-2xl mt-2 px-5 py-4 bg-slate-50/50 dark:bg-black/20 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
                <FaEnvelope className="theme-icon mr-3 text-xl" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  className="w-full !outline-none !bg-transparent !border-none !shadow-none !px-2 !py-2 text-[15px] theme-text-primary placeholder:text-slate-400 font-semibold"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-8">
              <div className="flex items-center border theme-border rounded-2xl mt-2 px-5 py-4 bg-slate-50/50 dark:bg-black/20 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
                <FaLock className="theme-icon mr-3 text-xl" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="Enter your password"
                  className="w-full !outline-none !bg-transparent !border-none !shadow-none !px-2 !py-2 text-[14px] theme-text-primary placeholder:text-slate-400 font-semibold"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="theme-icon text-lg hover:text-blue-500 transition-colors ml-2 cursor-pointer"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
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

    h-[55px]
    md:h-[55px]

    rounded-xl

    dashboard-btn-primary dark:dashboard-btn-primary 

    text-[13px]
    md:text-[14px]

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
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                <span className="relative z-10 font-bold tracking-wide">Login</span>
              )}
            </button>

            {/* FOOTER */}

            <p className="text-center mt-8 text-sm group">
              <span className="relative inline-flex items-center justify-center px-6 py-3 rounded-full">
                {/* Glowing Outer Border */}
                <span className="absolute inset-0 rounded-full border border-[var(--accent-color)] dark:border-[var(--accent-color-dark)] opacity-80 shadow-[0_0_15px_var(--accent-color)] dark:shadow-[0_0_15px_var(--accent-color-dark)] animate-pulse"></span>

                {/* Deep Background Glow */}
                <span className="absolute inset-0 rounded-full bg-[var(--accent-color)] dark:bg-[var(--accent-color-dark)] opacity-20 blur-xl animate-pulse"></span>

                {/* Content */}
                <span className="relative z-10 flex items-center gap-1.5 font-bold tracking-wide">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">
                    Developed by
                  </span>
                  <span className="text-[var(--accent-color)] dark:text-[var(--accent-color-dark)] font-medium uppercase drop-shadow-[0_0_8px_var(--accent-color)] dark:drop-shadow-[0_0_8px_var(--accent-color-dark)]">
                    Kerplunk Media
                  </span>
                </span>
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
