import axiosInstance from "./axiosInstance";

export const getLeads = async (params = {}) => {
  const res = await axiosInstance.get("/leads", { params });
  return res.data;
};

export const getLeadStats = async () => {
  const res = await axiosInstance.get("/leads/stats");
  return res.data;
};

export const getMetaStatus = async () => {
  const res = await axiosInstance.get("/leads/meta-status");
  return res.data;
};

export const updateLead = async (id, data) => {
  const res = await axiosInstance.patch(`/leads/${id}`, data);
  return res.data;
};

export const deleteLead = async (id) => {
  const res = await axiosInstance.delete(`/leads/${id}`);
  return res.data;
};

export const syncLeadsFromMeta = async (days = 90) => {
  const res = await axiosInstance.post("/leads/sync", { days });
  return res.data;
};

export const importLeads = async (rows) => {
  const res = await axiosInstance.post("/leads/import", { rows });
  return res.data;
};

export const exportLeadsCsv = async (params = {}) => {
  const res = await axiosInstance.get("/leads/export", { params, responseType: "blob" });
  return res.data;
};
