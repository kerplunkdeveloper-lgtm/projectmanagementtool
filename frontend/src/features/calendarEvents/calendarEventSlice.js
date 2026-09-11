import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCalendarEventsAPI,
  createCalendarEventAPI,
  updateCalendarEventAPI,
  deleteCalendarEventAPI,
} from "./calendarEventApi";

// ============================================
// GET CALENDAR EVENTS
// ============================================
export const getCalendarEvents = createAsyncThunk(
  "calendarEvents/getCalendarEvents",
  async (params, thunkAPI) => {
    try {
      return await getCalendarEventsAPI(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch events"
      );
    }
  }
);

// ============================================
// CREATE CALENDAR EVENT
// ============================================
export const createCalendarEvent = createAsyncThunk(
  "calendarEvents/createCalendarEvent",
  async (data, thunkAPI) => {
    try {
      return await createCalendarEventAPI(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create event"
      );
    }
  }
);

// ============================================
// UPDATE CALENDAR EVENT
// ============================================
export const updateCalendarEvent = createAsyncThunk(
  "calendarEvents/updateCalendarEvent",
  async ({ id, eventData }, thunkAPI) => {
    try {
      return await updateCalendarEventAPI(id, eventData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update event"
      );
    }
  }
);

// ============================================
// DELETE CALENDAR EVENT
// ============================================
export const deleteCalendarEvent = createAsyncThunk(
  "calendarEvents/deleteCalendarEvent",
  async (id, thunkAPI) => {
    try {
      return await deleteCalendarEventAPI(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete event"
      );
    }
  }
);

const calendarEventSlice = createSlice({
  name: "calendarEvents",

  initialState: {
    events: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // GET CALENDAR EVENTS
      .addCase(getCalendarEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCalendarEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.data;
      })
      .addCase(getCalendarEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE CALENDAR EVENT
      .addCase(createCalendarEvent.fulfilled, (state, action) => {
        state.events.unshift(action.payload.data);
      })

      // UPDATE CALENDAR EVENT
      .addCase(updateCalendarEvent.fulfilled, (state, action) => {
        state.events = state.events.map((event) =>
          event._id === action.payload.data._id
            ? action.payload.data
            : event
        );
      })

      // DELETE CALENDAR EVENT
      .addCase(deleteCalendarEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(
          (event) => event._id !== action.meta.arg
        );
      });
  },
});

export default calendarEventSlice.reducer;
