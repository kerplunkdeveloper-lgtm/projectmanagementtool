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
            className: "!theme-bg-card !theme-text-primary !border !theme-border !shadow-2xl !rounded-2xl !text-sm !font-bold !tracking-wide !px-4 !py-3",
            duration: 4000,
            style: {
              background: 'transparent',
              color: 'inherit',
              boxShadow: 'none',
              border: 'none',
              padding: 0,
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#fff',
              },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);