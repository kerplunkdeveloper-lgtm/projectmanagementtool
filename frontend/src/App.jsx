import React from "react";
import AppRoutes from "./routes/AppRoutes";
import ThemeSettingsPanel from "./components/common/ThemeSettingsPanel";

const App = () => {
  return (
    <>
      <AppRoutes />
      <ThemeSettingsPanel />
    </>
  );
};

export default App;