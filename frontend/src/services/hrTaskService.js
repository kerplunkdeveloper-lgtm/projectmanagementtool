import axiosInstance from "./axiosInstance";

export const getHrTasks = async (params = {}) => {
  const response = await axiosInstance.get("/hr-tasks", { params });
  return response.data;
};

export const getHrTaskMetrics = async () => {
  const response = await axiosInstance.get("/hr-tasks/metrics");
  return response.data;
};

export const getHrUsers = async () => {
  const response = await axiosInstance.get("/hr-tasks/hr-users");
  return response.data;
};

export const getHrTaskById = async (id) => {
  const response = await axiosInstance.get(`/hr-tasks/${id}`);
  return response.data;
};

export const createHrTask = async (taskData) => {
  const response = await axiosInstance.post("/hr-tasks", taskData);
  return response.data;
};

export const updateHrTask = async (id, taskData) => {
  const response = await axiosInstance.put(`/hr-tasks/${id}`, taskData);
  return response.data;
};

export const updateHrTaskStatus = async (id, status) => {
  const response = await axiosInstance.patch(`/hr-tasks/${id}/status`, { status });
  return response.data;
};

export const toggleChecklistItem = async (id, itemId) => {
  const response = await axiosInstance.patch(`/hr-tasks/${id}/checklist/${itemId}`);
  return response.data;
};

export const flagBlocker = async (id, payload) => {
  const response = await axiosInstance.post(`/hr-tasks/${id}/blocker`, payload);
  return response.data;
};

export const submitHrTask = async (id, payload) => {
  const response = await axiosInstance.post(`/hr-tasks/${id}/submit`, payload);
  return response.data;
};

export const reviewHrTask = async (id, payload) => {
  const response = await axiosInstance.post(`/hr-tasks/${id}/review`, payload);
  return response.data;
};

export const addComment = async (id, payload) => {
  const response = await axiosInstance.post(`/hr-tasks/${id}/comments`, payload);
  return response.data;
};

export const cancelHrTask = async (id) => {
  const response = await axiosInstance.post(`/hr-tasks/${id}/cancel`);
  return response.data;
};

export const deleteHrTask = async (id) => {
  const response = await axiosInstance.delete(`/hr-tasks/${id}`);
  return response.data;
};

export const uploadAttachment = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post("/hr-tasks/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export default {
  getHrTasks,
  getHrTaskMetrics,
  getHrUsers,
  getHrTaskById,
  createHrTask,
  updateHrTask,
  updateHrTaskStatus,
  toggleChecklistItem,
  flagBlocker,
  submitHrTask,
  reviewHrTask,
  addComment,
  cancelHrTask,
  deleteHrTask,
  uploadAttachment,
};
