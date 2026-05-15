import {
  FiHome,
  FiFolder,
  FiUsers,
  FiCheckSquare,
  FiBarChart2,
} from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";

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
      name: "Clients",
      path: "/admin/clients",
      icon: FiFolder,
    },

       {
      name: "Template Library",
      path: "/admin/template-library",
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

     {
      name: "profile",
      path: "/admin/profile",
      icon: FaRegUserCircle,
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
      icon: FiFolder,
    },
    {
      name: "Tasks",
      path: "/operationmanager/tasks",
      icon: FiCheckSquare,
    },
      {
      name: "profile",
      path: "/operationmanager/profile",
      icon: FaRegUserCircle,
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

      {
      name: "profile",
      path: "/team/profile",
      icon: FaRegUserCircle,
    },
  ],

};