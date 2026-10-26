import React from "react";
import AppRoutes from "./routes/AppRoutes";
import ThemeSettingsPanel from "./components/common/ThemeSettingsPanel";
import Preloader from "./components/common/Preloader";
import OfficeHoursPausedPopup from "./components/common/OfficeHoursPausedPopup";
import ResumePausedTasksPopup from "./components/common/ResumePausedTasksPopup";
import LunchBreakPopup from "./components/common/LunchBreakPopup";
import WaterReminderManager from "./components/common/WaterReminderManager";

const App = () => {
  return (
    <>
      <Preloader />
      <AppRoutes />
      <ThemeSettingsPanel />
      <OfficeHoursPausedPopup />
      <ResumePausedTasksPopup />
      <LunchBreakPopup />
      <WaterReminderManager />
    </>
  );
};

export default App;