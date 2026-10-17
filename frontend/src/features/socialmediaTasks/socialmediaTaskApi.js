import axiosInstance from "../../services/axiosInstance";

// GET all social media tasks
export const getSocialmediaTasksAPI = async (params = {}) => {
  const response = await axiosInstance.get("/socialmedia-task-calendar", { params });
  return response.data;
};

// GET metadata (clients, users, categories)
export const getSocialmediaMetadataAPI = async () => {
  const response = await axiosInstance.get("/socialmedia-task-calendar/meta");
  return response.data;
};

// GET monthly metrics and stats
export const getSocialmediaStatsAPI = async (params = {}) => {
  const response = await axiosInstance.get("/socialmedia-task-calendar/stats", { params });
  return response.data;
};

// GET single task
export const getSocialmediaTaskByIdAPI = async (id) => {
  const response = await axiosInstance.get(`/socialmedia-task-calendar/${id}`);
  return response.data;
};

// CREATE social media task
export const createSocialmediaTaskAPI = async (data) => {
  const response = await axiosInstance.post("/socialmedia-task-calendar", data);
  return response.data;
};

// UPDATE social media task
export const updateSocialmediaTaskAPI = async (id, data) => {
  const response = await axiosInstance.put(`/socialmedia-task-calendar/${id}`, data);
  return response.data;
};

// RESCHEDULE task (drag and drop / quick date shift)
export const rescheduleSocialmediaTaskAPI = async (id, data) => {
  const response = await axiosInstance.patch(`/socialmedia-task-calendar/${id}/reschedule`, data);
  return response.data;
};

// DELETE task
export const deleteSocialmediaTaskAPI = async (id) => {
  const response = await axiosInstance.delete(`/socialmedia-task-calendar/${id}`);
  return response.data;
};
