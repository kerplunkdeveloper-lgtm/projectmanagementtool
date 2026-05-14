import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import {
  loginAPI,
  logoutAPI,
} from "./authApi";

const userFromStorage = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

const initialState = {
  user: userFromStorage,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, thunkAPI) => {
    try {
      return await loginAPI(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response.data.message
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, thunkAPI) => {
    try {
      return await logoutAPI();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response.data.message
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.data.user;

        state.token = action.payload.token;

        localStorage.setItem(
          "user",
          JSON.stringify(action.payload.data.user)
        );

        localStorage.setItem(
          "token",
          action.payload.token
        );
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {

        state.user = null;

        state.token = null;

        localStorage.removeItem("user");

        localStorage.removeItem("token");
      });
  },
});

export default authSlice.reducer;