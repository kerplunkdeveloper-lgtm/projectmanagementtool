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
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);