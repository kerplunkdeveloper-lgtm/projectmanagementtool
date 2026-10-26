import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  getUsersAPI,
  getUserAPI,
  createUserAPI,
  updateUserAPI,
  deleteUserAPI,
  relieveUserAPI,
  reactivateUserAPI,
  logWaterBreakAPI,
} from './userApi';


// GET ALL USERS
export const getUsers = createAsyncThunk(
  'users/getUsers',
  async (_, thunkAPI) => {

    try {

      return await getUsersAPI();

    } catch (err) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
);


// GET SINGLE USER
export const getUser = createAsyncThunk(
  'users/getUser',
  async (id, thunkAPI) => {

    try {

      return await getUserAPI(id);

    } catch (err) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
);


// CREATE USER
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, thunkAPI) => {

    try {

      return await createUserAPI(userData);

    } catch (err) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
);


// UPDATE USER
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, thunkAPI) => {

    try {

      return await updateUserAPI(id, userData);

    } catch (err) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
);


// DELETE USER
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, thunkAPI) => {

    try {

      await deleteUserAPI(id);

      return id;

    } catch (err) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
);

// RELIEVE USER
export const relieveUser = createAsyncThunk(
  'users/relieveUser',
  async ({ id, reason }, thunkAPI) => {
    try {
      return await relieveUserAPI(id, reason);
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to relieve user'
      );
    }
  }
);

// REACTIVATE USER
export const reactivateUser = createAsyncThunk(
  'users/reactivateUser',
  async (id, thunkAPI) => {
    try {
      return await reactivateUserAPI(id);
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to reactivate user'
      );
    }
  }
);

// LOG WATER BREAK
export const logWaterBreak = createAsyncThunk(
  'users/logWaterBreak',
  async (_, thunkAPI) => {
    try {
      return await logWaterBreakAPI();
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to log water break'
      );
    }
  }
);


const getInitialUsers = () => {
  try {
    const cached = localStorage.getItem('pmt_cached_users');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
};

const initialState = {
  users: getInitialUsers(),
  user: null,
  loading: false,
  error: null,
};


const userSlice = createSlice({
  name: 'users',

  initialState,

  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {

    builder

      // GET USERS
      .addCase(getUsers.pending, (state) => {
        state.loading = true;
      })

      .addCase(getUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        try {
          localStorage.setItem('pmt_cached_users', JSON.stringify(action.payload.data));
        } catch {}
      })

      .addCase(getUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // GET SINGLE USER
      .addCase(getUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(getUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
      })

      .addCase(getUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // CREATE USER
      .addCase(createUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;

        state.users.unshift(action.payload.data);
      })

      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateUser.fulfilled, (state, action) => {

        state.loading = false;

        state.users = state.users.map((user) =>
          user._id === action.payload.data._id
            ? action.payload.data
            : user
        );
      })

      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // DELETE USER
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(deleteUser.fulfilled, (state, action) => {

        state.loading = false;

        state.users = state.users.filter(
          (user) => user._id !== action.payload
        );
      })

      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // RELIEVE USER
      .addCase(relieveUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(relieveUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.map((user) =>
          user._id === action.payload.data._id
            ? action.payload.data
            : user
        );
      })

      .addCase(relieveUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // REACTIVATE USER
      .addCase(reactivateUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(reactivateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.map((user) =>
          user._id === action.payload.data._id
            ? action.payload.data
            : user
        );
      })

      .addCase(reactivateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // LOG WATER BREAK
      .addCase(logWaterBreak.fulfilled, (state, action) => {
        if (state.user && action.payload?.waterReminder) {
          state.user.waterReminder = action.payload.waterReminder;
        }
      });
  },
});

export const { clearUserError } = userSlice.actions;

export default userSlice.reducer;