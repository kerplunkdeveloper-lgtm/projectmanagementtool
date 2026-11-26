import { createSlice, createAsyncThunk, current, original, isDraft } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { isTaskAtRisk } from "../../utils/smCommitmentUtils";
import {
  getSocialmediaTasksAPI,
  getSocialmediaTasksPagedAPI,
  getSocialmediaStatsAPI,
  createSocialmediaTaskAPI,
  updateSocialmediaTaskAPI,
  rescheduleSocialmediaTaskAPI,
  deleteSocialmediaTaskAPI,
  bulkDeleteSocialmediaTasksAPI,
  getSocialmediaMetadataAPI,
  bulkImportSocialmediaTasksAPI,
} from "./socialmediaTaskApi";

// ─── Task list cache (stale-while-revalidate) ───────────────────────────────
// Every task-list response is cached per query (e.g. one entry per calendar month).
// Revisiting a month renders the cached list instantly while a background request
// refreshes it, and responses from superseded requests never overwrite newer data.
const MAX_CACHED_QUERIES = 12;
const PREFETCH_TTL_MS = 60 * 1000;

// Stable key for a query: same params in any order → same key.
export const makeTasksKey = (params) => {
  const src = params || {};
  const clean = {};
  Object.keys(src)
    .sort()
    .forEach((k) => {
      const v = src[k];
      if (v !== undefined && v !== null && v !== "") clean[k] = String(v);
    });
  return JSON.stringify(clean);
};

const writeCache = (state, key, entry) => {
  if (!state.tasksCache) state.tasksCache = {};
  state.tasksCache[key] = entry;
  const keys = Object.keys(state.tasksCache);
  if (keys.length > MAX_CACHED_QUERIES) {
    keys
      .sort((a, b) => (state.tasksCache[a].fetchedAt || 0) - (state.tasksCache[b].fetchedAt || 0))
      .slice(0, keys.length - MAX_CACHED_QUERIES)
      .forEach((k) => delete state.tasksCache[k]);
  }
};

// After a local mutation (create/update/delete…) the on-screen list is the source of
// truth: keep it as the cache entry for its query and drop the others, because the
// changed task may also appear in (or have moved to) another month.
// It also bumps `mutationVersion`, which server-paginated views watch to refetch their page
// (a changed task may now belong on a different page or no longer match the filters).
const syncCacheAfterMutation = (state) => {
  state.mutationVersion = (state.mutationVersion || 0) + 1;
  if (!state.tasksKey) {
    state.tasksCache = {};
    return;
  }
  state.tasksCache = {
    [state.tasksKey]: {
      data: state.tasks,
      totalCount: state.totalCount,
      commitmentsCount: state.commitmentsCount,
      meta: state.pageMeta,
      fetchedAt: Date.now(),
    },
  };
};

const applyEntry = (state, key, entry) => {
  state.tasks = entry.data;
  state.totalCount = entry.totalCount;
  state.commitmentsCount = entry.commitmentsCount;
  state.pageMeta = entry.meta || null;
  state.tasksKey = key;
};

// Shared list reducers (calendar month list + paged SM Tasks list)
const listPending = (state, action, key) => {
  state.tasksRequestId = action.meta.requestId;
  state.requestedTasksKey = key;
  state.loading = true;
  state.error = null;
  // Stale-while-revalidate: show the cached list for this query immediately
  if (state.tasksKey !== key) {
    const cached = readCache(state, key);
    if (cached) applyEntry(state, key, cached);
  }
};

const listFulfilled = (state, action, key) => {
  const data = action.payload.data || [];
  const entry = {
    data,
    totalCount: action.payload.totalCount || data.length || 0,
    commitmentsCount: action.payload.commitmentsCount || 0,
    meta: action.payload.meta || null,
    fetchedAt: Date.now(),
  };
  if (action.meta.requestId !== state.tasksRequestId) {
    // Superseded (user already moved on): keep it for later, don't render it
    if (key !== state.tasksKey) writeCache(state, key, entry);
    return;
  }
  writeCache(state, key, entry);
  state.loading = false;
  applyEntry(state, key, entry);
};

const listRejected = (state, action) => {
  if (action.meta.requestId !== state.tasksRequestId) return;
  state.loading = false;
  state.error = action.payload;
};

// Paged queries get their own key space so they never collide with calendar month keys
export const makePagedTasksKey = (params) => makeTasksKey({ ...(params || {}), __view: "paged" });

// Read a cache entry as a plain (non-draft) object so it can be placed into `tasks`.
const readCache = (state, key) => {
  const cache = state.tasksCache;
  if (!cache) return null;
  const base = isDraft(cache) ? original(cache) : cache;
  return (base && base[key]) || null;
};

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

// GET ONE PAGE OF TASKS (SM Tasks table) — filtering, sorting and pagination run on the server
export const getSocialmediaTasksPage = createAsyncThunk(
  "socialmediaTasks/getSocialmediaTasksPage",
  async (params, thunkAPI) => {
    try {
      const res = await getSocialmediaTasksPagedAPI(params);
      return {
        data: res.data || [],
        totalCount: res.totalAll || 0,
        commitmentsCount: 0,
        meta: {
          page: res.page || 1,
          limit: res.limit || 10,
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          filteredCommitments: res.filteredCommitments || 0,
          totalAll: res.totalAll || 0,
        },
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch social media tasks"
      );
    }
  }
);

// PREFETCH TASKS — fills the cache only; never touches the on-screen list or loading flags.
// Used when hovering the prev/next buttons so the next month opens instantly.
export const prefetchSocialmediaTasks = createAsyncThunk(
  "socialmediaTasks/prefetchSocialmediaTasks",
  async (params, thunkAPI) => {
    try {
      return await getSocialmediaTasksAPI(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Prefetch failed");
    }
  },
  {
    condition: (params, { getState }) => {
      const s = getState().socialmediaTasks;
      const key = makeTasksKey(params);
      if (s.tasksKey === key) return false;
      if (s.prefetching?.[key]) return false;
      if (s.loading && s.requestedTasksKey === key) return false;
      const cached = s.tasksCache?.[key];
      if (cached && Date.now() - cached.fetchedAt < PREFETCH_TTL_MS) return false;
      return true;
    },
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
// Options (all optional, passed in the arg object):
//   optimistic: true → apply `data` to the task in the store immediately (instant UI),
//                      roll back automatically if the request fails.
//   silent: true     → skip the generic "Task updated successfully" toast (caller shows its own).
export const updateSocialmediaTask = createAsyncThunk(
  "socialmediaTasks/updateSocialmediaTask",
  async ({ id, data, silent }, thunkAPI) => {
    try {
      const response = await updateSocialmediaTaskAPI(id, data);
      if (!silent) toast.success("Task updated successfully");
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

// BULK DELETE TASKS
export const bulkDeleteSocialmediaTasks = createAsyncThunk(
  "socialmediaTasks/bulkDeleteSocialmediaTasks",
  async (taskIds, thunkAPI) => {
    try {
      await bulkDeleteSocialmediaTasksAPI(taskIds);
      toast.success(`${taskIds.length} task(s) deleted successfully`);
      return taskIds;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete tasks";
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

// BULK IMPORT COMMITMENT TASKS
export const bulkImportSocialmediaTasks = createAsyncThunk(
  "socialmediaTasks/bulkImportSocialmediaTasks",
  async (tasks, thunkAPI) => {
    try {
      const response = await bulkImportSocialmediaTasksAPI(tasks);
      toast.success(response.message || "Commitment tasks imported successfully!");
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to import tasks";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
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
  // Query key of the list currently in `tasks` (null = nothing loaded yet)
  tasksKey: null,
  // Key / requestId of the most recent list request — older responses are ignored
  requestedTasksKey: null,
  tasksRequestId: null,
  statsRequestId: null,
  // queryKey → { data, totalCount, commitmentsCount, meta, fetchedAt }
  tasksCache: {},
  // Paged list info for the SM Tasks table: { page, limit, total, totalPages, filteredCommitments, totalAll }
  pageMeta: null,
  // Incremented after every successful create/update/delete — paged views refetch on change
  mutationVersion: 0,
  // queryKey → true while a prefetch is in flight
  prefetching: {},
  error: null,
  // requestId → { id, prevFields } for rolling back optimistic updates on failure
  optimisticUpdates: {},
  // taskId → requestId of the most recent update; older responses must not overwrite newer state
  latestUpdateReq: {},
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
  const atRisk = commitments.filter((t) => isTaskAtRisk(t, now.getTime())).length;
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
      // GET TASKS (calendar) and GET TASKS PAGE (SM Tasks table) share the same
      // cache / stale-response handling; only the cache key differs.
      .addCase(getSocialmediaTasks.pending, (state, action) => listPending(state, action, makeTasksKey(action.meta.arg)))
      .addCase(getSocialmediaTasks.fulfilled, (state, action) => listFulfilled(state, action, makeTasksKey(action.meta.arg)))
      .addCase(getSocialmediaTasks.rejected, listRejected)
      .addCase(getSocialmediaTasksPage.pending, (state, action) => listPending(state, action, makePagedTasksKey(action.meta.arg)))
      .addCase(getSocialmediaTasksPage.fulfilled, (state, action) => listFulfilled(state, action, makePagedTasksKey(action.meta.arg)))
      .addCase(getSocialmediaTasksPage.rejected, listRejected)

      // PREFETCH TASKS
      .addCase(prefetchSocialmediaTasks.pending, (state, action) => {
        if (!state.prefetching) state.prefetching = {};
        state.prefetching[makeTasksKey(action.meta.arg)] = true;
      })
      .addCase(prefetchSocialmediaTasks.fulfilled, (state, action) => {
        const key = makeTasksKey(action.meta.arg);
        if (state.prefetching) delete state.prefetching[key];
        // Never overwrite the list on screen (it may hold newer local edits)
        if (key === state.tasksKey) return;
        const data = action.payload.data || [];
        writeCache(state, key, {
          data,
          totalCount: action.payload.totalCount || data.length || 0,
          commitmentsCount: action.payload.commitmentsCount || 0,
          fetchedAt: Date.now(),
        });
      })
      .addCase(prefetchSocialmediaTasks.rejected, (state, action) => {
        if (state.prefetching) delete state.prefetching[makeTasksKey(action.meta.arg)];
      })

      // GET STATS (ignore responses from superseded requests, e.g. fast month switching)
      .addCase(getSocialmediaStats.pending, (state, action) => {
        state.statsRequestId = action.meta.requestId;
        state.statsLoading = true;
      })
      .addCase(getSocialmediaStats.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.statsRequestId) return;
        state.statsLoading = false;
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
      })
      .addCase(getSocialmediaStats.rejected, (state, action) => {
        if (action.meta.requestId !== state.statsRequestId) return;
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
          syncCacheAfterMutation(state);
        }
      })

      // BULK IMPORT COMMITMENT TASKS
      .addCase(bulkImportSocialmediaTasks.fulfilled, (state, action) => {
        if (action.payload?.data && Array.isArray(action.payload.data)) {
          const newTasks = action.payload.data;
          const existingIds = new Set(state.tasks.map((t) => (t._id || t.id)?.toString()));
          const toAdd = newTasks.filter((t) => !existingIds.has((t._id || t.id)?.toString()));
          state.tasks = [...toAdd, ...state.tasks];
          state.totalCount += toAdd.length;
          recalcStats(state);
          syncCacheAfterMutation(state);
        }
      })

      // UPDATE TASK
      .addCase(updateSocialmediaTask.pending, (state, action) => {
        const { id, data, optimistic } = action.meta.arg || {};
        if (!id) return;
        if (!state.latestUpdateReq) state.latestUpdateReq = {};
        if (!state.optimisticUpdates) state.optimisticUpdates = {};
        state.latestUpdateReq[id] = action.meta.requestId;
        if (!optimistic || !data) return;
        const index = state.tasks.findIndex((t) => t._id === id);
        if (index === -1) return;
        // Snapshot only the fields being changed so they can be restored on failure
        const snapshot = current(state.tasks[index]);
        const prevFields = {};
        Object.keys(data).forEach((k) => {
          prevFields[k] = snapshot[k];
        });
        state.optimisticUpdates[action.meta.requestId] = { id, prevFields };
        Object.assign(state.tasks[index], data);
      })
      .addCase(updateSocialmediaTask.fulfilled, (state, action) => {
        const { requestId, arg } = action.meta;
        if (state.optimisticUpdates) delete state.optimisticUpdates[requestId];
        const id = arg?.id || action.payload?.data?._id;
        // If a newer update for this task is still in flight, don't overwrite its (newer)
        // optimistic state with this older server response — the newer response will settle it.
        const isLatest = !state.latestUpdateReq || state.latestUpdateReq[id] === requestId;
        if (state.latestUpdateReq && isLatest) delete state.latestUpdateReq[id];
        if (action.payload.data && isLatest) {
          const index = state.tasks.findIndex((t) => t._id === action.payload.data._id);
          if (index !== -1) {
            state.tasks[index] = action.payload.data;
          }
        }
        recalcStats(state);
        syncCacheAfterMutation(state);
      })
      .addCase(updateSocialmediaTask.rejected, (state, action) => {
        const { requestId, arg } = action.meta;
        const backup = state.optimisticUpdates?.[requestId];
        if (backup) delete state.optimisticUpdates[requestId];
        const id = arg?.id;
        const isLatest = state.latestUpdateReq?.[id] === requestId;
        if (isLatest) delete state.latestUpdateReq[id];
        // Roll back the optimistic change (only if no newer update has replaced it)
        if (backup && isLatest) {
          const index = state.tasks.findIndex((t) => t._id === backup.id);
          if (index !== -1) Object.assign(state.tasks[index], backup.prevFields);
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
          syncCacheAfterMutation(state);
        }
      })

      // DELETE TASK
      .addCase(deleteSocialmediaTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
        recalcStats(state);
        syncCacheAfterMutation(state);
      })

      // BULK DELETE TASKS
      .addCase(bulkDeleteSocialmediaTasks.fulfilled, (state, action) => {
        const idsSet = new Set(action.payload);
        state.tasks = state.tasks.filter((t) => !idsSet.has(t._id));
        state.totalCount = Math.max(0, state.totalCount - action.payload.length);
        recalcStats(state);
        syncCacheAfterMutation(state);
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
