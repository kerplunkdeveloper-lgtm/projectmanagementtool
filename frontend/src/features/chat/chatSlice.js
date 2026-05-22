import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";

export const fetchDirectMessages = createAsyncThunk(
  "chat/fetchDirectMessages",
  async (userId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/messages/direct/${userId}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load direct messages");
    }
  }
);

export const fetchGroupMessages = createAsyncThunk(
  "chat/fetchGroupMessages",
  async (roomId, thunkAPI) => {
    try {
      const url = roomId && roomId !== "group" ? `/messages/group/${roomId}` : "/messages/group";
      const response = await axiosInstance.get(url);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load group messages");
    }
  }
);

export const sendMessageAction = createAsyncThunk(
  "chat/sendMessageAction",
  async (messageData, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/messages", messageData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to send message");
    }
  }
);

// Get all custom groups the user belongs to
export const fetchRooms = createAsyncThunk(
  "chat/fetchRooms",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/messages/rooms");
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch custom groups");
    }
  }
);

// Create a custom group room
export const createRoomAction = createAsyncThunk(
  "chat/createRoomAction",
  async (roomData, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/messages/rooms", roomData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create group");
    }
  }
);

// Update custom group room details (name, description, or members)
export const updateRoomAction = createAsyncThunk(
  "chat/updateRoomAction",
  async ({ id, roomData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/messages/rooms/${id}`, roomData);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update group");
    }
  }
);

// Delete custom group room
export const deleteRoomAction = createAsyncThunk(
  "chat/deleteRoomAction",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/messages/rooms/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete group");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    rooms: [],
    loading: false,
    error: null,
  },
  reducers: {
    receiveMessage: (state, action) => {
      const exists = state.messages.some((m) => m._id === action.payload._id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDirectMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDirectMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchDirectMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchGroupMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessageAction.fulfilled, (state, action) => {
        const exists = state.messages.some((m) => m._id === action.payload._id);
        if (!exists) {
          state.messages.push(action.payload);
        }
      })
      // Rooms/Groups Reducers
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.rooms = action.payload;
      })
      .addCase(createRoomAction.fulfilled, (state, action) => {
        state.rooms.push(action.payload);
      })
      .addCase(updateRoomAction.fulfilled, (state, action) => {
        state.rooms = state.rooms.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
      })
      .addCase(deleteRoomAction.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter((r) => r._id !== action.payload);
      });
  },
});

export const { receiveMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
