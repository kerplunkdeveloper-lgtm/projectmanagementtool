import axiosInstance from "./axiosInstance";

// Sorted Rooms API. Every call goes through the authenticated axios instance;
// membership and permissions are enforced on the server.

export const getRoomConfig = async () => (await axiosInstance.get("/rooms/config")).data.data;
export const listRooms = async () => (await axiosInstance.get("/rooms")).data.data;
export const createRoom = async (payload) => (await axiosInstance.post("/rooms", payload)).data.data;
export const joinRoom = async (code) => (await axiosInstance.post("/rooms/join", { code })).data.data;
export const getRoom = async (id) => (await axiosInstance.get(`/rooms/${id}`)).data.data;
export const updateRoom = async (id, payload) => (await axiosInstance.patch(`/rooms/${id}`, payload)).data.data;
export const endRoom = async (id) => (await axiosInstance.delete(`/rooms/${id}`)).data;
export const leaveRoom = async (id) => (await axiosInstance.post(`/rooms/${id}/leave`)).data;
export const rotateRoomCode = async (id) => (await axiosInstance.post(`/rooms/${id}/rotate-code`)).data.data;
export const removeMember = async (id, userId) =>
  (await axiosInstance.delete(`/rooms/${id}/members/${userId}`)).data;
/** Real-time notes: send a diff-match-patch patch; the server merges and returns the merged text. */
export const saveNotesPatch = async (id, { patch, clientId }) =>
  (await axiosInstance.put(`/rooms/${id}/notes`, { patch, clientId })).data.data;
export const markNotesSeen = async (id, seq) =>
  (await axiosInstance.post(`/rooms/${id}/notes/seen`, { seq })).data.data;

export const listFiles = async (id) => (await axiosInstance.get(`/rooms/${id}/files`)).data.data;
export const deleteFile = async (id, fileId) => (await axiosInstance.delete(`/rooms/${id}/files/${fileId}`)).data;
export const getFileUrl = async (id, fileId, mode = "download") =>
  (await axiosInstance.get(`/rooms/${id}/files/${fileId}/url`, { params: { mode } })).data.data.url;

export const uploadFile = async (id, file, { onProgress, signal } = {}) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axiosInstance.post(`/rooms/${id}/files`, form, {
    signal,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return res.data.data;
};

/** Human readable message from an axios error. */
export const apiError = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || (err?.code === "ERR_NETWORK" ? "Network error. Check your connection." : fallback);
