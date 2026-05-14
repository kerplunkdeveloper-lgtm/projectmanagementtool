import {
  FiHome,
  FiFolder,
  FiUsers,
  FiCheckSquare,
  FiBarChart2,
} from "react-icons/fi";

export const sidebarConfig = {

  admin: [
    {
      name: "Dashboard",
      path: "/admin",
      icon: FiHome,
    },
    {
      name: "Projects",
      path: "/admin/projects",
      icon: FiFolder,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: FiUsers,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: FiBarChart2,
    },
  ],

  operationmanager: [
    {
      name: "Dashboard",
      path: "/operation",
      icon: FiHome,
    },
    {
      name: "Projects",
      path: "/operation/projects",
      icon: FiFolder,
    },
    {
      name: "Tasks",
      path: "/operation/tasks",
      icon: FiCheckSquare,
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
      icon: FiCheckSquare,
    },
  ],

};