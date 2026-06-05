import {
  LuBuilding2,
  LuFolderKanban,
  LuLayoutTemplate,
  LuUsers,
  LuCalendarDays,
  LuHandshake,
  LuMessagesSquare,
  LuClipboardCheck,
} from "react-icons/lu";
import { FiBarChart2, FiUser, FiHome } from "react-icons/fi";

export const sidebarConfig = {
  admin: [
    {
      name: "Dashboard",
      path: "/admin",
      icon: FiHome,
    },
    {
      name: "Clients",
      path: "/admin/clients",
      icon: LuBuilding2,
    },
    {
      name: "Projects",
      path: "/admin/projects",
      icon: LuFolderKanban,
    },

    {
      name: "Tasks",
      path: "/admin/tasks",
      icon: LuClipboardCheck,
    },
    {
      name: "Template Library",
      path: "/admin/template-library",
      icon: LuLayoutTemplate,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: LuUsers,
    },
    {
      name: "EOD Reports",
      path: "/admin/eod-reports",
      icon: FiBarChart2,
    },
    {
      name: "Calendar",
      path: "/admin/calendar",
      icon: LuCalendarDays,
    },
    {
      name: "PartnerHub",
      path: "/admin/partnerhub",
      icon: LuHandshake,
    },
    {
      name: "Profile",
      path: "/admin/profile",
      icon: FiUser,
    },
    {
      name: "Chat",
      path: "/admin/chat",
      icon: LuMessagesSquare,
    },
  ],

  operationmanager: [
    {
      name: "Dashboard",
      path: "/operationmanager",
      icon: FiHome,
    },
    {
      name: "Projects",
      path: "/operationmanager/projects",
      icon: LuFolderKanban,
    },
    {
      name: "Tasks",
      path: "/operationmanager/tasks",
      icon: LuClipboardCheck,
    },
    {
      name: "Calendar",
      path: "/operationmanager/calendar",
      icon: LuCalendarDays,
    },
    {
      name: "Users",
      path: "/operationmanager/users",
      icon: LuUsers,
    },
    {
      name: "Profile",
      path: "/operationmanager/profile",
      icon: FiUser,
    },
    {
      name: "Chat",
      path: "/operationmanager/chat",
      icon: LuMessagesSquare,
    },
  ],

  team: [
    {
      name: "Dashboard",
      path: "/team",
      icon: FiHome,
    },
    {
      name: "My Tasks",
      path: "/team/tasks",
      icon: LuClipboardCheck,
    },
    {
      name: "EOD Reports",
      path: "/team/eod-reports",
      icon: FiBarChart2,
    },
    {
      name: "Profile",
      path: "/team/profile",
      icon: FiUser,
    },
    {
      name: "Chat",
      path: "/team/chat",
      icon: LuMessagesSquare,
    },
  ],
};