import { useState, useEffect } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiSlice } from "../../features/api/apiSlice";
import { preloadRoute } from "../../routes/AppRoutes";

import loginHero from "../../assets/login-hero.png";
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


  const year = new Date().getFullYear();

  const inputWrap =
    "group relative flex items-center h-[50px] rounded-xl border border-white/70 bg-white/70 backdrop-blur-md px-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-slate-300 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15";
  const inputCls =
    "login-input w-full !outline-none !bg-transparent !border-none !shadow-none !p-0 text-[14.5px] text-slate-900 placeholder:text-slate-400 font-medium";
  const labelCls = "block text-[13px] font-semibold text-slate-700 mb-2";

  // Classic staggered entrance for card contents
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
  };
  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden flex flex-col">
      {/* ================= FULL-SCREEN BACKGROUND IMAGE ================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 md:bg-none md:bg-[#eef8f1]"
      >
        {/* Static image (no zoom) — anchored so the badges + team stay fully visible */}
        <img
          src={loginHero}
          alt=""
          aria-hidden="true"
          draggable="false"
          className="hidden md:block w-full h-full object-cover object-[38%_center] lg:object-[100%_22%]"
        />
      </motion.div>

      {/* Overlays: photo stays bright; only a soft bottom shade for footer text */}
      <div className="fixed inset-x-0 bottom-0 h-40 z-0 pointer-events-none hidden md:block bg-gradient-to-t from-slate-900/35 to-transparent" />
      {/* Mobile/tablet: light wash so the centered card reads well */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block bg-white/25 lg:hidden" />
      {/* Desktop: soft light wash on the right card area only */}
      <div className="fixed inset-y-0 right-0 w-[45%] z-0 pointer-events-none hidden lg:block bg-gradient-to-l from-white/30 via-white/10 to-transparent" />

      {/* ================= LOGIN CARD (center on mobile/tablet, right on desktop) ================= */}
      {/* Desktop: 62% image zone (left, kept clear) | 38% card zone (right, empty green area) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:grid lg:grid-cols-[62fr_38fr] lg:px-0 lg:pr-8 xl:pr-12">
        <div className="hidden lg:block" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[420px] xl:max-w-[440px] 2xl:max-w-[470px] lg:justify-self-center"
        >
          {/* Animated glass border glow (slow pulse) */}
          <motion.div
            aria-hidden="true"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            className="absolute inset-0 rounded-[24px] ring-1 ring-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_36px_-4px_rgba(16,185,129,0.45)] pointer-events-none"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-[24px] bg-white/80 md:bg-white/25 backdrop-blur-2xl backdrop-saturate-[1.8] border border-white/50 shadow-[0_24px_60px_-18px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.25)] px-6 py-8 sm:px-9 sm:py-9"
          >
            {/* Glass light sheen (top) */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none"
            />
            {/* Glass shine sweep (repeats every few seconds) */}
            <motion.span
              aria-hidden="true"
              initial={{ x: "-160%" }}
              animate={{ x: "260%" }}
              transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 4.5, delay: 1.2 }}
              className="absolute -top-1/4 left-0 h-[150%] w-1/3 rotate-[18deg] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
            />
            {/* Header */}
            <motion.div variants={item} className="relative flex flex-col items-center text-center mb-7">
              <img
                src={sorted}
                alt="Sorted"
                className="h-10 sm:h-11 w-auto object-contain mb-5"
                draggable="false"
              />
              <h1 className="text-[24px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-[14px] text-slate-700 font-medium mt-2">
                Sign in to manage your projects, tasks &amp; team
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative space-y-5">
              <motion.div variants={item}>
                <label htmlFor="login-email" className={labelCls}>
                  Email address
                </label>
                <div className={inputWrap}>
                  <FaEnvelope className="text-slate-400 group-focus-within:text-emerald-600 mr-3 text-[15px] shrink-0 transition-colors" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@company.com"
                    required
                    value={formData.email}
                    className={inputCls}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>

              <motion.div variants={item}>
                <label htmlFor="login-password" className={labelCls}>
                  Password
                </label>
                <div className={inputWrap}>
                  <FaLock className="text-slate-400 group-focus-within:text-emerald-600 mr-3 text-[15px] shrink-0 transition-colors" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    className={inputCls}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="ml-2 -mr-1 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash className="text-[15px]" /> : <FaEye className="text-[15px]" />}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={item}>
              <button
                type="submit"
                disabled={loading}
                className="login-btn group relative overflow-hidden w-full h-[52px] mt-2 rounded-xl text-[15px] font-semibold shadow-[0_12px_28px_-10px_rgba(16,185,129,0.75)] hover:shadow-[0_16px_34px_-10px_rgba(16,185,129,0.85)] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                    Sign in
                    <FaArrowRight className="text-[13px] transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                )}
              </button>
              </motion.div>
            </form>

            {/* Divider + credit */}
            <motion.div variants={item} className="relative mt-6 pt-5 border-t border-white/50 flex items-center justify-center">
              <a
                href="https://www.kerplunkmedia.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developed by Kerplunk Media (opens in a new tab)"
                className="group relative inline-flex items-center justify-center rounded-full p-[1.5px] overflow-hidden shadow-[0_6px_18px_-8px_rgba(16,185,129,0.6)] hover:shadow-[0_8px_22px_-6px_rgba(16,185,129,0.75)] hover:-translate-y-[1px] transition-all duration-300 cursor-pointer"
              >
                {/* Spinning gradient border */}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  className="absolute left-1/2 top-1/2 w-[300%] aspect-square bg-[conic-gradient(from_0deg,transparent_0deg,#10b981_70deg,#34d399_120deg,transparent_180deg,transparent_250deg,#059669_310deg,transparent_360deg)]"
                  style={{ x: "-50%", y: "-50%" }}
                />
                <span className="relative z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-1.5 text-[12.5px] font-medium text-slate-600">
                  Developed by
                  <span className="font-bold text-emerald-600 tracking-wide group-hover:text-emerald-700 transition-colors">
                    Kerplunk Media
                  </span>
                </span>
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 px-5 sm:px-8 lg:px-12 pb-5 flex items-center justify-center sm:justify-end gap-2 text-[12px] font-medium text-slate-500 md:text-white/90 md:[text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
        <span>© {year} Sorted. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default Login;
