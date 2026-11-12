import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const getApiBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (!baseUrl || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      return "/api";
    }
  }
  if (!baseUrl) return "http://localhost:5001/api";
  return baseUrl.replace(/\/+$/, "") + (baseUrl.endsWith("/api") ? "" : "/api");
};

const baseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("originalRole");
    localStorage.removeItem("originalAdminUser");
    localStorage.removeItem("originalAdminToken");
    window.location.href = "/";
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Task", "Project", "Notification", "Goal", "User"],
  keepUnusedDataFor: 300,          // 5 min cache — prevents skeleton on page re-visits
  refetchOnMountOrArgChange: 300,  // Only refetch after 5 min stale (prevents redundant calls)
  refetchOnFocus: false,           // BUG-05 FIX: Tab switch-ல் refetch வேண்டாம் → 429 error குறையும்
  refetchOnReconnect: true,        // Internet reconnect-ல் refetch (இது OK)
  endpoints: (builder) => ({
    // ==========================================
    // GOALS ENDPOINTS
    // ==========================================
    getGoals: builder.query({
      query: () => "/goals",
      providesTags: ["Goal"],
      transformResponse: (response) => response.data,
    }),
    createGoal: builder.mutation({
      query: (goalData) => ({
        url: "/goals",
        method: "POST",
        body: goalData,
      }),
      invalidatesTags: ["Goal"],
    }),
    updateGoal: builder.mutation({
      query: ({ id, goalData }) => ({
        url: `/goals/${id}`,
        method: "PUT",
        body: goalData,
      }),
      async onQueryStarted({ id, goalData }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData("getGoals", undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const goal = draft.find((g) => g._id === id);
            if (goal) {
              Object.assign(goal, goalData);
              if (goalData.completed !== undefined) {
                goal.completedAt = goalData.completed
                  ? new Date().toISOString()
                  : null;
              }
            }
          })
        );
        try {
          const { data: updatedGoalResponse } = await queryFulfilled;
          if (updatedGoalResponse?.data) {
            dispatch(
              apiSlice.util.updateQueryData("getGoals", undefined, (draft) => {
                if (!Array.isArray(draft)) return;
                const index = draft.findIndex((g) => g._id === id);
                if (index !== -1) {
                  draft[index] = updatedGoalResponse.data;
                }
              })
            );
          }
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteGoal: builder.mutation({
      query: (id) => ({
        url: `/goals/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData("getGoals", undefined, (draft) => {
            if (!Array.isArray(draft)) return;
            const index = draft.findIndex((g) => g._id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // ==========================================
    // TASKS ENDPOINTS
    // ==========================================
    getTasks: builder.query({
      query: (params) => {
        if (!params || Object.keys(params).length === 0) return "/tasks";
        const queryParams = new URLSearchParams();
        if (params.active_only) queryParams.append('active_only', params.active_only);
        if (params.minimal) queryParams.append('minimal', params.minimal);
        if (params.project && params.project !== "all") queryParams.append('project', params.project);
        if (params.department) queryParams.append('department', params.department);
        if (params.include_unassigned) queryParams.append('include_unassigned', params.include_unassigned);
        if (params.my_tasks) queryParams.append('my_tasks', params.my_tasks);
        if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
        if (params.all) queryParams.append('all', params.all);
        if (params.status_overview) queryParams.append('status_overview', params.status_overview);
        return `/tasks?${queryParams.toString()}`;
      },
      providesTags: ["Task"],
      keepUnusedDataFor: 300, // 5 min cache — instant navigation back to workload page
      transformResponse: (response) => response.data,
    }),
    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      async onQueryStarted(taskData, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: createdResponse } = await queryFulfilled;
          const createdTask = createdResponse?.data;
          if (createdTask) {
            const queries = getState()?.api?.queries || {};
            const seenArgs = new Set();

            const appendToDraft = (args) => {
              const keyStr = JSON.stringify(args ?? null);
              if (seenArgs.has(keyStr)) return;
              seenArgs.add(keyStr);

              // Check project match if filter is present
              if (args?.project && args.project !== "all") {
                const taskProjId = createdTask.project?._id || createdTask.project;
                if (String(taskProjId) !== String(args.project)) return;
              }

              dispatch(
                apiSlice.util.updateQueryData("getTasks", args, (draft) => {
                  if (!Array.isArray(draft)) return;
                  if (!draft.some((t) => t._id === createdTask._id)) {
                    draft.push(createdTask);
                  }
                })
              );
            };

            Object.keys(queries).forEach((k) => {
              const q = queries[k];
              if (q && q.endpointName === "getTasks" && q.status === "fulfilled") {
                appendToDraft(q.originalArgs);
              }
            });

            [undefined, { my_tasks: true }, { active_only: true, minimal: true }, { minimal: true }, { active_only: true }].forEach(appendToDraft);
          }
        } catch {
          // creation error, handled by caller
        }
      },
    }),
    updateTask: builder.mutation({
      query: ({ id, taskData }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: taskData,
      }),
      async onQueryStarted({ id, taskData }, { dispatch, queryFulfilled, getState }) {
        const queries = getState()?.api?.queries || {};
        const patchResults = [];
        const seenArgs = new Set();

        const updateDraft = (args) => {
          const keyStr = JSON.stringify(args ?? null);
          if (seenArgs.has(keyStr)) return;
          seenArgs.add(keyStr);

          const patch = dispatch(
            apiSlice.util.updateQueryData("getTasks", args, (draft) => {
              if (!Array.isArray(draft)) return;
              const task = draft.find((t) => t._id === id);
              if (task) {
                Object.assign(task, taskData);
                if (taskData.status && taskData.status !== "In Progress") {
                  task.actualStartTime = null;
                }
              }
            })
          );
          patchResults.push(patch);
        };

        // Scan all cached getTasks queries in memory (covers { project: id }, department, my_tasks, etc.)
        Object.keys(queries).forEach((k) => {
          const q = queries[k];
          if (q && q.endpointName === "getTasks" && q.status === "fulfilled") {
            updateDraft(q.originalArgs);
          }
        });

        // Fallback standard keys
        [undefined, { my_tasks: true }, { active_only: true, minimal: true }, { minimal: true }, { active_only: true }].forEach(updateDraft);

        try {
          const { data: updatedTaskResponse } = await queryFulfilled;
          const updatedTask = updatedTaskResponse?.data;
          if (updatedTask) {
            seenArgs.forEach((keyStr) => {
              const args = keyStr === "null" ? undefined : JSON.parse(keyStr);
              dispatch(
                apiSlice.util.updateQueryData("getTasks", args, (draft) => {
                  if (!Array.isArray(draft)) return;
                  const index = draft.findIndex((t) => t._id === id);
                  if (index !== -1) {
                    draft[index] = { ...draft[index], ...updatedTask };
                  }
                })
              );
            });
          }
        } catch {
          patchResults.forEach((p) => p.undo());
        }
      },
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const queries = getState()?.api?.queries || {};
        const patchResults = [];
        const seenArgs = new Set();

        const deleteFromDraft = (args) => {
          const keyStr = JSON.stringify(args ?? null);
          if (seenArgs.has(keyStr)) return;
          seenArgs.add(keyStr);

          const patch = dispatch(
            apiSlice.util.updateQueryData("getTasks", args, (draft) => {
              if (!Array.isArray(draft)) return;
              const index = draft.findIndex((t) => t._id === id);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
          patchResults.push(patch);
        };

        // Scan all cached getTasks queries in memory
        Object.keys(queries).forEach((k) => {
          const q = queries[k];
          if (q && q.endpointName === "getTasks" && q.status === "fulfilled") {
            deleteFromDraft(q.originalArgs);
          }
        });

        // Fallback standard keys
        [undefined, { my_tasks: true }, { active_only: true, minimal: true }, { minimal: true }, { active_only: true }].forEach(deleteFromDraft);

        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((p) => p.undo());
        }
      },
    }),

    // ==========================================
    // PROJECTS ENDPOINTS
    // ==========================================
    getProjects: builder.query({
      query: (params) => {
        if (!params || Object.keys(params).length === 0) return "/projects";
        const queryParams = new URLSearchParams();
        if (params.minimal) queryParams.append('minimal', params.minimal);
        return `/projects?${queryParams.toString()}`;
      },
      providesTags: ["Project"],
      transformResponse: (response) => response.data,
    }),
    createProject: builder.mutation({
      query: (projectData) => ({
        url: "/projects",
        method: "POST",
        body: projectData,
      }),
      invalidatesTags: ["Project"],
    }),
    updateProject: builder.mutation({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Project"],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),
    assignProject: builder.mutation({
      query: ({ id, assignedTo }) => ({
        url: `/projects/${id}/assign`,
        method: "PUT",
        body: { assignedTo },
      }),
      invalidatesTags: ["Project"],
    }),

    // ==========================================
    // NOTIFICATIONS ENDPOINTS
    // ==========================================
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notification"],
      transformResponse: (response) => {
        const notifications = response?.data || [];
        return notifications.filter(n => n.type !== 'message_received');
      },
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PUT",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            const notification = draft.find(n => n._id === id);
            if (notification) {
              notification.isRead = true;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "PUT",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            draft.forEach((n) => {
              n.isRead = true;
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            const index = draft.findIndex(n => n._id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Notification"],
    }),

    // ==========================================
    // USER ENDPOINTS
    // ==========================================
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Task"],
    }),

    getTeamActivity: builder.query({
      query: (date) => (date ? `/users/team-activity?date=${date}` : `/users/team-activity`),
      providesTags: ["User"],
    }),
  }),
});

export const {
  // Task hooks
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,

  // Project hooks
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignProjectMutation,

  // Notification hooks
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,

  // User hooks
  useUpdateUserMutation,
  useGetTeamActivityQuery,

  // Goal hooks
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,


} = apiSlice;

