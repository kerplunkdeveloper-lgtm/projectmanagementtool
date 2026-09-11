import axiosInstance from "../../services/axiosInstance";

// GET all calendar events
export const getCalendarEventsAPI = async (params = {}) => {
  const response = await axiosInstance.get("/calendar-events", { params });
  return response.data;
};

// CREATE calendar event
export const createCalendarEventAPI = async (data) => {
  const response = await axiosInstance.post("/calendar-events", data);
  return response.data;
};

// UPDATE calendar event
export const updateCalendarEventAPI = async (id, data) => {
  const response = await axiosInstance.put(`/calendar-events/${id}`, data);
  return response.data;
};

// DELETE calendar event
export const deleteCalendarEventAPI = async (id) => {
  const response = await axiosInstance.delete(`/calendar-events/${id}`);
  return response.data;
};
