import { FaRegBuilding } from "react-icons/fa";
import {
  FiBriefcase,
  FiGlobe,
  FiLayers,
  FiVideo,
  FiShoppingBag,
  FiHeart,
  FiCode,
  FiCpu,
  FiTarget,
  FiUsers
} from "react-icons/fi";

export const getClientIconComponent = (iconName) => {
  return CLIENT_ICONS[iconName] || FaRegBuilding;
};

export const CLIENT_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Orange", value: "#f97316" }
];

export const CLIENT_ICONS = {
  FaRegBuilding,
  FiBriefcase,
  FiGlobe,
  FiLayers,
  FiVideo,
  FiShoppingBag,
  FiHeart,
  FiCode,
  FiCpu,
  FiTarget,
  FiUsers
};
