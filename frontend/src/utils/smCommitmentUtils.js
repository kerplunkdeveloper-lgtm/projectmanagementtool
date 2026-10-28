// frontend/src/utils/smCommitmentUtils.js

/**
 * Format a date object/string to short display format like "26 Oct" or "26 Oct 2024"
 */
export const formatCommitmentDate = (dateVal, includeYear = false) => {
  if (!dateVal) return "-";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "-";
    const day = d.getDate();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months[d.getMonth()];
    if (includeYear) {
      return `${day} ${month} ${d.getFullYear()}`;
    }
    return `${day} ${month}`;
  } catch {
    return "-";
  }
};

/**
 * Check if a task belongs to Reel category
 */
export const isTaskReel = (contentType) => {
  const type = (contentType || "").trim().toLowerCase();
  return type === "reel" || type === "reels" || type === "youtube";
};

/**
 * Check if a task belongs to Story category
 */
export const isTaskStory = (contentType) => {
  const type = (contentType || "").trim().toLowerCase();
  return type === "story" || type === "stories";
};

/**
 * Check if a task belongs to Post category (Post, Carousel, GMB, Blog, Ad, etc.)
 */
export const isTaskPost = (contentType) => {
  return !isTaskReel(contentType) && !isTaskStory(contentType);
};

/**
 * Match task to a client from clients list
 */
export const matchTaskClient = (task, clients = []) => {
  if (!task) return null;
  const taskId = task.client && typeof task.client === "object" ? task.client._id : task.client;
  const taskName = (task.clientName || (task.client && task.client.companyName) || "").trim().toLowerCase();

  return (
    clients.find((c) => {
      if (taskId && c._id && c._id.toString() === taskId.toString()) return true;
      if (taskName && c.companyName && c.companyName.trim().toLowerCase() === taskName) return true;
      return false;
    }) || null
  );
};

/**
 * Compute commitment breakdown for a single client for a given month/year
 */
export const computeSingleClientCommitments = (client, tasks = [], month = null, year = null) => {
  if (!client) return null;

  const clientName = client.companyName || "Unknown Client";
  const clientId = client._id ? client._id.toString() : null;
  const clientLower = clientName.trim().toLowerCase();

  // Filter tasks belonging to this client
  const clientTasks = tasks.filter((t) => {
    const tId = t.client && typeof t.client === "object" ? t.client._id?.toString() : t.client?.toString();
    const tName = (t.clientName || (t.client && t.client.companyName) || "").trim().toLowerCase();
    const isClientMatch = (clientId && tId === clientId) || (clientLower && tName === clientLower);
    if (!isClientMatch) return false;

    // Filter by month/year if supplied
    if (month !== null && year !== null) {
      const taskDate = t.publishDate || t.dueDate || t.createdAt;
      if (taskDate) {
        const d = new Date(taskDate);
        if (!isNaN(d.getTime())) {
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          if (m !== month || y !== year) {
            // If month doesn't match, exclude
            return false;
          }
        }
      }
    }
    return true;
  });

  // Buckets
  const postTasks = clientTasks.filter((t) => isTaskPost(t.contentType));
  const reelTasks = clientTasks.filter((t) => isTaskReel(t.contentType));
  const storyTasks = clientTasks.filter((t) => isTaskStory(t.contentType));

  // Helper to aggregate content bucket
  const processBucket = (taskList, committedNumber) => {
    const postedTasks = taskList.filter((t) => ["Completed", "Live"].includes(t.status));
    const inHandTasks = taskList.filter((t) => !["Completed", "Live"].includes(t.status));

    const postedCount = postedTasks.length;
    const inHandCount = inHandTasks.length;

    // Sub-status breakdown for in-hand
    const inQC = inHandTasks.filter((t) => t.status === "In QC").length;
    const inProgress = inHandTasks.filter((t) => t.status === "In progress").length;
    const scheduled = inHandTasks.filter((t) => t.status === "Scheduled").length;
    const notStarted = inHandTasks.filter((t) => ["Not started", "Draft"].includes(t.status)).length;

    let inHandNote = "";
    if (inHandCount > 0) {
      if (inQC > 0) {
        inHandNote = `${inHandCount} - awaiting approval`;
      } else if (scheduled > 0) {
        inHandNote = `${inHandCount} - scheduled`;
      } else if (inProgress > 0) {
        inHandNote = `${inHandCount} in progress`;
      } else {
        inHandNote = `${inHandCount} in hand`;
      }
    } else {
      inHandNote = "0";
    }

    // Pending: how many more tasks need to be created/planned to meet commitment
    const committed = Math.max(committedNumber || 0, postedCount + inHandCount > 0 ? (committedNumber || 0) : 0);
    const pendingToPlan = Math.max(0, committed - postedCount - inHandCount);
    const pendingToDeliver = Math.max(0, committed - postedCount);

    // Latest post date
    let lastPostDate = "-";
    let lastPostRaw = null;
    if (postedTasks.length > 0) {
      const sorted = [...postedTasks].sort((a, b) => {
        const da = new Date(a.publishDate || a.dueDate || a.createdAt).getTime();
        const db = new Date(b.publishDate || b.dueDate || b.createdAt).getTime();
        return db - da;
      });
      lastPostRaw = sorted[0].publishDate || sorted[0].dueDate || sorted[0].createdAt;
      lastPostDate = formatCommitmentDate(lastPostRaw);
    }

    return {
      committed,
      posted: postedCount,
      inHand: inHandCount,
      inHandNote,
      inQC,
      inProgress,
      scheduled,
      notStarted,
      pending: pendingToPlan,
      pendingDelivery: pendingToDeliver,
      lastPostDate,
      lastPostRaw,
      progressPct: committed > 0 ? Math.min(100, Math.round((postedCount / committed) * 100)) : 0,
      tasks: taskList,
    };
  };

  const postsSummary = processBucket(postTasks, Number(client.posts ?? client.post ?? 0));
  const reelsSummary = processBucket(reelTasks, Number(client.reels ?? client.reel ?? 0));
  const storySummary = processBucket(storyTasks, Number(client.story ?? client.stories ?? 0));

  const totalCommitted = postsSummary.committed + reelsSummary.committed + storySummary.committed;
  const totalPosted = postsSummary.posted + reelsSummary.posted + storySummary.posted;
  const totalInHand = postsSummary.inHand + reelsSummary.inHand + storySummary.inHand;
  const totalPending = postsSummary.pending + reelsSummary.pending + storySummary.pending;
  const totalPendingDelivery = postsSummary.pendingDelivery + reelsSummary.pendingDelivery + storySummary.pendingDelivery;

  // Overall last published
  const allPosted = clientTasks.filter((t) => ["Completed", "Live"].includes(t.status));
  let lastPublishedFormatted = "-";
  if (allPosted.length > 0) {
    const sorted = [...allPosted].sort((a, b) => {
      const da = new Date(a.publishDate || a.dueDate || a.createdAt).getTime();
      const db = new Date(b.publishDate || b.dueDate || b.createdAt).getTime();
      return db - da;
    });
    lastPublishedFormatted = formatCommitmentDate(sorted[0].publishDate || sorted[0].dueDate || sorted[0].createdAt, true);
  }

  // Next due upcoming date
  const upcoming = clientTasks.filter((t) => !["Completed", "Live"].includes(t.status) && (t.dueDate || t.publishDate));
  let nextDueFormatted = "-";
  if (upcoming.length > 0) {
    const sortedUpcoming = [...upcoming].sort((a, b) => {
      const da = new Date(a.publishDate || a.dueDate).getTime();
      const db = new Date(b.publishDate || b.dueDate).getTime();
      return da - db;
    });
    nextDueFormatted = formatCommitmentDate(sortedUpcoming[0].publishDate || sortedUpcoming[0].dueDate, true);
  }

  return {
    client,
    clientId,
    clientName,
    color: client.color || "#6366f1",
    industry: client.industry || "General",
    icon: client.icon || "FaRegBuilding",
    posts: postsSummary,
    reels: reelsSummary,
    story: storySummary,
    totalCommitted,
    totalPosted,
    totalInHand,
    totalPending,
    totalPendingDelivery,
    lastPublishedFormatted,
    nextDueFormatted,
    overallPct: totalCommitted > 0 ? Math.min(100, Math.round((totalPosted / totalCommitted) * 100)) : 0,
    allTasksCount: clientTasks.length,
  };
};

/**
 * Compute commitment breakdown across ALL clients
 */
export const computeAllClientsCommitments = (
  clients = [],
  tasks = [],
  month = null,
  year = null,
  restrictToPassedClients = false
) => {
  // Map clients from DB
  const clientMap = new Map();
  (clients || []).forEach((c) => {
    if (c.companyName) {
      clientMap.set(c.companyName.trim().toLowerCase(), c);
    }
  });

  // Only scan tasks for other missing clients if we are NOT restricting to passed clients
  if (!restrictToPassedClients) {
    (tasks || []).forEach((t) => {
      const name = (t.clientName || "").trim();
      if (name && !clientMap.has(name.toLowerCase())) {
        clientMap.set(name.toLowerCase(), {
          _id: t.client?._id || t.client || name,
          companyName: name,
          color: t.clientColor || "#6366f1",
          industry: "General",
          posts: 0,
          reels: 0,
          story: 0,
        });
      }
    });
  }

  const clientList = Array.from(clientMap.values());
  const clientSummaries = clientList
    .map((c) => computeSingleClientCommitments(c, tasks, month, year))
    .filter(Boolean);

  // Overall totals
  let totalPostsCommitted = 0;
  let totalPostsPublished = 0;
  let totalReelsCommitted = 0;
  let totalReelsPublished = 0;
  let totalStoriesCommitted = 0;
  let totalStoriesPublished = 0;
  let totalDeliverablesCommitted = 0;
  let totalDeliverablesPublished = 0;
  let awaitingApprovalCount = 0;
  let atRiskCount = 0;

  const now = Date.now();

  // Total At Risk and Awaiting approval from active tasks
  (tasks || []).forEach((t) => {
    if (!["Completed", "Live"].includes(t.status)) {
      if (t.status === "In QC") {
        awaitingApprovalCount++;
      }
      const target = t.publishDate || t.dueDate;
      if (target) {
        const diffHours = (new Date(target).getTime() - now) / (1000 * 60 * 60);
        if (diffHours <= 24) {
          atRiskCount++;
        }
      }
    }
  });

  clientSummaries.forEach((cs) => {
    totalPostsCommitted += cs.posts.committed;
    totalPostsPublished += cs.posts.posted;
    totalReelsCommitted += cs.reels.committed;
    totalReelsPublished += cs.reels.posted;
    totalStoriesCommitted += cs.story.committed;
    totalStoriesPublished += cs.story.posted;
    totalDeliverablesCommitted += cs.totalCommitted;
    totalDeliverablesPublished += cs.totalPosted;
  });

  const postsProgressPct =
    totalPostsCommitted > 0 ? Math.min(100, Math.round((totalPostsPublished / totalPostsCommitted) * 100)) : 0;
  const reelsProgressPct =
    totalReelsCommitted > 0 ? Math.min(100, Math.round((totalReelsPublished / totalReelsCommitted) * 100)) : 0;
  const storiesProgressPct =
    totalStoriesCommitted > 0 ? Math.min(100, Math.round((totalStoriesPublished / totalStoriesCommitted) * 100)) : 0;
  const deliverablesProgressPct =
    totalDeliverablesCommitted > 0
      ? Math.min(100, Math.round((totalDeliverablesPublished / totalDeliverablesCommitted) * 100))
      : 0;

  return {
    clientSummaries,
    totalPostsCommitted,
    totalPostsPublished,
    postsProgressPct,
    totalReelsCommitted,
    totalReelsPublished,
    reelsProgressPct,
    totalStoriesCommitted,
    totalStoriesPublished,
    storiesProgressPct,
    totalDeliverablesCommitted,
    totalDeliverablesPublished,
    deliverablesProgressPct,
    awaitingApprovalCount,
    atRiskCount,
  };
};

/**
 * Get the commitment label and progress for a single task row
 * Returns e.g. { committed: 8, published: 7, label: "7/8 published", progressPct: 88 }
 */
export const getTaskCommitmentProgress = (task, clients = [], tasks = [], month = null, year = null) => {
  if (!task) return null;

  const client = matchTaskClient(task, clients);
  if (!client) {
    // If no client object found, default based on task
    return {
      committed: 1,
      published: ["Completed", "Live"].includes(task.status) ? 1 : 0,
      label: ["Completed", "Live"].includes(task.status) ? "1/1 published" : "0/1 published",
      progressPct: ["Completed", "Live"].includes(task.status) ? 100 : 0,
    };
  }

  const clientSummary = computeSingleClientCommitments(client, tasks, month, year);
  if (!clientSummary) return null;

  if (isTaskReel(task.contentType)) {
    const { committed, posted, progressPct } = clientSummary.reels;
    const displayCommitted = committed || Math.max(1, posted);
    return {
      type: "Reels",
      committed: displayCommitted,
      published: posted,
      label: `${posted}/${displayCommitted} published`,
      tagLabel: `October Reels ${posted}/${displayCommitted}`,
      progressPct: Math.min(100, Math.round((posted / displayCommitted) * 100)),
    };
  } else if (isTaskStory(task.contentType)) {
    const { committed, posted, progressPct } = clientSummary.story;
    const displayCommitted = committed || Math.max(1, posted);
    return {
      type: "Stories",
      committed: displayCommitted,
      published: posted,
      label: `${posted}/${displayCommitted} published`,
      tagLabel: `October Stories ${posted}/${displayCommitted}`,
      progressPct: Math.min(100, Math.round((posted / displayCommitted) * 100)),
    };
  } else {
    // Post / Carousel
    const { committed, posted, progressPct } = clientSummary.posts;
    const displayCommitted = committed || Math.max(1, posted);
    return {
      type: "Posts",
      committed: displayCommitted,
      published: posted,
      label: `${posted}/${displayCommitted} published`,
      tagLabel: `October Posts ${posted}/${displayCommitted}`,
      progressPct: Math.min(100, Math.round((posted / displayCommitted) * 100)),
    };
  }
};

