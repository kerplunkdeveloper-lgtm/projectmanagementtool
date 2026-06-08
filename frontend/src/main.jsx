import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App";
import "./index.css";
import { store } from "./app/store";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
            },
            className: "flex items-center gap-3 !bg-white/95 dark:!bg-[#0f172a]/95 backdrop-blur-xl !border !border-slate-200/60 dark:!border-slate-800/80 !shadow-2xl shadow-slate-200/20 dark:shadow-slate-900/50 !rounded-2xl !text-slate-800 dark:!text-slate-100 !text-[13px] !font-black tracking-wide !px-5 !py-4 transition-all",
            success: {
              className: "flex items-center gap-3 !bg-emerald-50/95 dark:!bg-[#022c22]/95 backdrop-blur-xl !border !border-emerald-200/60 dark:!border-emerald-800/60 !shadow-2xl shadow-emerald-500/20 dark:shadow-emerald-900/50 !rounded-2xl !text-emerald-800 dark:!text-emerald-400 !text-[13px] !font-black tracking-wide !px-5 !py-4 transition-all",
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              className: "flex items-center gap-3 !bg-rose-50/95 dark:!bg-[#4c0519]/95 backdrop-blur-xl !border !border-rose-200/60 dark:!border-rose-800/60 !shadow-2xl shadow-rose-500/20 dark:shadow-rose-900/50 !rounded-2xl !text-rose-800 dark:!text-rose-400 !text-[13px] !font-black tracking-wide !px-5 !py-4 transition-all",
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);