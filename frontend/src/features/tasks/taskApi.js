import axiosInstance from "../../services/axiosInstance";

export const getTasksAPI = async (projectId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (projectId && projectId !== "all") queryParams.append("project", projectId);
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== "project") queryParams.append(k, v);
    });
  }
  const qs = queryParams.toString();
  const url = qs ? `/tasks?${qs}` : "/tasks";
  const response = await axiosInstance.get(url);
  return response.data;
};

export const createTaskAPI = async (taskData) => {
  const response = await axiosInstance.post("/tasks", taskData);
  return response.data;
};

export const updateTaskAPI = async (id, taskData) => {
  const response = await axiosInstance.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTaskAPI = async (id) => {
  const response = await axiosInstance.delete(`/tasks/${id}`);
  return response.data;
};
