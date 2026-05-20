import {
  FiHome,
  FiFolder,
  FiUsers,
  FiCheckSquare,
  FiBarChart2,
  FiCalendar,
} from "react-icons/fi";
import { FaRegUserCircle } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { FaHandsHoldingCircle } from "react-icons/fa6";

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
      icon: FiFolder,
    },

    
    {
      name: "Projects",
      path: "/admin/projects",
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
      name: "EOD Reports",
      path: "/admin/eod-reports",
      icon: TbReportSearch,
    },
    {
      name: "Calendar",
      path: "/admin/calendar",
      icon: FiCalendar,
    },


     {
      name: "PartnerHub",
      path: "/admin/partnerhub",
      icon: FaHandsHoldingCircle,
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
      name: "Calendar",
      path: "/operationmanager/calendar",
      icon: FiCalendar,
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
      name: "EOD Reports",
      path: "/team/eod-reports",
      icon: FiBarChart2,
    },
     {
      name: "profile",
      path: "/team/profile",
      icon: FaRegUserCircle,
    },
  ],

};