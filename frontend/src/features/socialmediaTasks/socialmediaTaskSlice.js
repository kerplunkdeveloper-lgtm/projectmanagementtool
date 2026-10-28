import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import {
  getSocialmediaTasksAPI,
  getSocialmediaStatsAPI,
  createSocialmediaTaskAPI,
  updateSocialmediaTaskAPI,
  rescheduleSocialmediaTaskAPI,
  deleteSocialmediaTaskAPI,
  getSocialmediaMetadataAPI,
} from "./socialmediaTaskApi";

// GET ALL TASKS
export const getSocialmediaTasks = createAsyncThunk(
  "socialmediaTasks/getSocialmediaTasks",
  async (params, thunkAPI) => {
    try {
      return await getSocialmediaTasksAPI(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch social media tasks"
      );
    }
  }
);

// GET STATS
export const getSocialmediaStats = createAsyncThunk(
  "socialmediaTasks/getSocialmediaStats",
  async (params, thunkAPI) => {
    try {
      return await getSocialmediaStatsAPI(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch stats"
      );
    }
  }
);

// CREATE TASK
export const createSocialmediaTask = createAsyncThunk(
  "socialmediaTasks/createSocialmediaTask",
  async (data, thunkAPI) => {
    try {
      const response = await createSocialmediaTaskAPI(data);
      toast.success("Task created successfully");
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create task";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// UPDATE TASK
export const updateSocialmediaTask = createAsyncThunk(
  "socialmediaTasks/updateSocialmediaTask",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await updateSocialmediaTaskAPI(id, data);
      toast.success("Task updated successfully");
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update task";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// RESCHEDULE TASK
export const rescheduleSocialmediaTask = createAsyncThunk(
  "socialmediaTasks/rescheduleSocialmediaTask",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await rescheduleSocialmediaTaskAPI(id, data);
      toast.success("Task rescheduled");
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to reschedule";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// DELETE TASK
export const deleteSocialmediaTask = createAsyncThunk(
  "socialmediaTasks/deleteSocialmediaTask",
  async (id, thunkAPI) => {
    try {
      await deleteSocialmediaTaskAPI(id);
      toast.success("Task removed");
      return id;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete task";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// GET METADATA
export const getSocialmediaMetadata = createAsyncThunk(
  "socialmediaTasks/getSocialmediaMetadata",
  async (_, thunkAPI) => {
    try {
      return await getSocialmediaMetadataAPI();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch metadata"
      );
    }
  }
);

const initialState = {
  tasks: [],
  totalCount: 0,
  commitmentsCount: 0,
  stats: {
    commitments: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    atRisk: 0,
    achievement: 0,
    targetAchievement: 90.0,
    activeClients: 0,
  },
  metadata: {
    clients: [],
    users: [],
  },
  loading: false,
  statsLoading: false,
  error: null,
};

const recalcStats = (state) => {
  const now = new Date();
  const commitments = state.tasks.filter((t) => t.commitment && t.publishDate);
  const total = commitments.length;
  const completed = commitments.filter((t) => ['Completed', 'Live'].includes(t.status)).length;
  const overdue = commitments.filter((t) => {
    if (['Completed', 'Live'].includes(t.status)) return false;
    return new Date(t.publishDate) < now || t.status === 'Overdue';
  }).length;
  const pending = commitments.filter((t) =>
    ['In QC', 'Scheduled', 'In progress', 'Not started'].includes(t.status) &&
    new Date(t.publishDate) >= now
  ).length;
  const atRisk = commitments.filter((t) => {
    if (['Completed', 'Live'].includes(t.status)) return false;
    const targetDate = t.publishDate || t.dueDate;
    if (!targetDate) return false;
    const diffHours = (new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  }).length;
  const achievement = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;
  const activeClients = new Set(commitments.map((t) => t.clientName).filter(Boolean)).size;

  state.stats = {
    ...state.stats,
    commitments: total,
    completed,
    pending,
    overdue,
    atRisk,
    achievement,
    activeClients,
  };
};

const socialmediaTaskSlice = createSlice({
  name: "socialmediaTasks",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET TASKS
      .addCase(getSocialmediaTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSocialmediaTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.data || [];
        state.totalCount = action.payload.totalCount || action.payload.data?.length || 0;
        state.commitmentsCount = action.payload.commitmentsCount || 0;
      })
      .addCase(getSocialmediaTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET STATS
      .addCase(getSocialmediaStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(getSocialmediaStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
      })
      .addCase(getSocialmediaStats.rejected, (state) => {
        state.statsLoading = false;
      })

      // CREATE TASK
      .addCase(createSocialmediaTask.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.tasks.unshift(action.payload.data);
          state.totalCount += 1;
          if (action.payload.data.commitment) {
            state.commitmentsCount += 1;
          }
          recalcStats(state);
        }
      })

      // UPDATE TASK
      .addCase(updateSocialmediaTask.fulfilled, (state, action) => {
        if (action.payload.data) {
          const index = state.tasks.findIndex((t) => t._id === action.payload.data._id);
          if (index !== -1) {
            state.tasks[index] = action.payload.data;
          }
          recalcStats(state);
        }
      })

      // RESCHEDULE TASK
      .addCase(rescheduleSocialmediaTask.fulfilled, (state, action) => {
        if (action.payload.data) {
          const index = state.tasks.findIndex((t) => t._id === action.payload.data._id);
          if (index !== -1) {
            state.tasks[index] = action.payload.data;
          }
          recalcStats(state);
        }
      })

      // DELETE TASK
      .addCase(deleteSocialmediaTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
        recalcStats(state);
      })

      // GET METADATA
      .addCase(getSocialmediaMetadata.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.metadata = action.payload.data;
        }
      });
  },
});

export const { clearError } = socialmediaTaskSlice.actions;
export default socialmediaTaskSlice.reducer;
