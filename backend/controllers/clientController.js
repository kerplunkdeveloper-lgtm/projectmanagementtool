const Client = require("../models/Client");
const Notification = require("../models/Notification");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const ClientSplitHistory = require("../models/ClientSplitHistory");

const isSocialMediaManagerUser = (user) => {
  if (!user) return false;
  const dept = (user.department || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  if (dept.includes("social media executive") || dept.includes("executive")) return false;
  return (
    role === "socialmediamanager" ||
    role === "socialmediahead" ||
    dept.includes("social media head") ||
    dept.includes("social media manager")
  );
};

const isPrivilegedClientUser = (user) => {
  if (!user) return false;
  if (
    user.role === "admin" ||
    user.role === "operationmanager" ||
    user.role === "operation manager"
  ) {
    return true;
  }
  const dept = (user.department || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  return (
    dept.includes("finance") ||
    dept.includes("account") ||
    role === "finance" ||
    role === "accountant"
  );
};

// Which services are billed on a cycle vs. delivered once (fixed scope).
const RECURRING_SERVICES = new Set([
  "Digital Marketing",
  "Social Media Management",
  "SEO",
  "Content Marketing",
]);

/**
 * Cleans serviceDetails from the request and derives `service` and
 * `projectType` from it. Returns { error } or { service, serviceDetails, projectType }.
 * Returns null when the request carries no serviceDetails (legacy clients).
 */
const normalizeServicePlan = (serviceDetails) => {
  if (!Array.isArray(serviceDetails)) return null;
  if (serviceDetails.length === 0) {
    return { error: "Please select at least one service" };
  }

  const seen = new Set();
  const cleaned = [];
  for (const d of serviceDetails) {
    if (!d || !d.name || seen.has(d.name)) continue;
    seen.add(d.name);

    const type = RECURRING_SERVICES.has(d.name) ? "Recurring" : "One-time";
    const startDate = d.startDate ? new Date(d.startDate) : null;
    const endDate = d.endDate ? new Date(d.endDate) : null;
    const timeline = type === "One-time" ? d.timeline || "Fixed Duration" : "";

    if (!startDate || Number.isNaN(startDate.getTime())) {
      return { error: `${d.name}: start date is required` };
    }
    if (endDate && (Number.isNaN(endDate.getTime()) || endDate < startDate)) {
      return { error: `${d.name}: end date cannot be before start date` };
    }
    if (type === "One-time" && timeline === "Fixed Duration" && !endDate) {
      return { error: `${d.name}: end date is required for a fixed-duration project` };
    }

    cleaned.push({
      name: d.name,
      type,
      billingCycle: type === "Recurring" ? d.billingCycle || "Monthly" : "",
      timeline,
      startDate,
      endDate: timeline === "Open (TBD)" ? null : endDate,
    });
  }

  const hasRecurring = cleaned.some((d) => d.type === "Recurring");
  const hasOneTime = cleaned.some((d) => d.type === "One-time");

  return {
    serviceDetails: cleaned,
    service: cleaned.map((d) => d.name),
    projectType: hasRecurring && hasOneTime ? "Hybrid" : hasRecurring ? "Recurring" : "One-time",
  };
};

// @desc    Create Client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    if (isSocialMediaManagerUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Social Media Head has read-only access to clients",
      });
    }

    const {
      companyName,
      branch,
      industry,
      onboardingDate,
      phoneNumber,
      spoc,
      designation,
      budget,
      gst,
      service,
      serviceDetails,
      reels,
      posts,
      story,
      needDslr,
      pages,
      onpage,
      offpage,
      assignedTo,
      color,
      icon,
    } = req.body;

    const plan = normalizeServicePlan(serviceDetails);
    if (plan?.error) {
      return res.status(400).json({ success: false, message: plan.error });
    }

    if (!branch || !branch.trim()) {
      return res.status(400).json({
        success: false,
        message: "Branch is required",
      });
    }

    const totalBudget =
      Number(budget) +
      (Number(budget) * Number(gst)) / 100;

    const client = await Client.create({
      companyName,
      branch: branch.trim(),
      industry,
      onboardingDate,
      phoneNumber,
      spoc,
      designation,
      budget,
      gst,
      totalBudget,
      service: plan ? plan.service : service,
      serviceDetails: plan ? plan.serviceDetails : [],
      projectType: plan ? plan.projectType : "",
      reels,
      posts,
      story,
      needDslr,
      pages,
      onpage,
      offpage,
      color,
      icon,
      createdBy: req.user._id,
      assignedTo: !isPrivilegedClientUser(req.user)
        ? [req.user._id]
        : (Array.isArray(assignedTo) ? assignedTo.map(id => id._id || id) : (assignedTo ? [assignedTo._id || assignedTo] : [])),
    });

    const populatedClient = await Client.findById(client._id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role department");

    // Real-time Notification to assigned users
    if (populatedClient.assignedTo && populatedClient.assignedTo.length > 0) {
      const io = req.app.get("io");
      for (const member of populatedClient.assignedTo) {
        if (member._id.toString() !== req.user._id.toString()) {
          const notification = await Notification.create({
            recipient: member._id,
            sender: req.user._id,
            type: "client_assigned",
            message: `You have been assigned to Client: "${populatedClient.companyName}"`,
          });
          if (io) {
            const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
            io.to(member._id.toString()).emit("notification", populatedNotification);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: populatedClient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Get All Clients
// @route   GET /api/clients
// @access  Private
// @desc    Get All Clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    let query = {};
    if (isSocialMediaManagerUser(req.user)) {
      query.branch = new RegExp("^chennai$", "i");
    } else if (
      !isPrivilegedClientUser(req.user) ||
      req.query.assignedOnly === "true"
    ) {
      query.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id },
      ];
    }

    const clients = await Client.find(query)
      .populate(
        "createdBy",
        "name email role"
      )
      .populate(
        "assignedTo",
        "name email role department"
      )
      .sort({ createdAt: -1 })
      .lean();

    if (isSocialMediaManagerUser(req.user)) {
      clients.forEach((c) => {
        delete c.budget;
        delete c.gst;
        delete c.totalBudget;
      });
    }

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Get Single Client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(
      req.params.id
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role department")
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const isAssigned = client.assignedTo && (
      Array.isArray(client.assignedTo)
        ? client.assignedTo.some(item => (item._id ? item._id.toString() : item.toString()) === req.user._id.toString())
        : (client.assignedTo._id ? client.assignedTo._id.toString() : client.assignedTo.toString()) === req.user._id.toString()
    );

    if (!isPrivilegedClientUser(req.user) && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this client",
      });
    }

    if (isSocialMediaManagerUser(req.user)) {
      delete client.budget;
      delete client.gst;
      delete client.totalBudget;
    }

    if (isSocialMediaManagerUser(req.user) && client) {
      const clientObj = client.toObject ? client.toObject() : client;
      delete clientObj.budget;
      delete clientObj.gst;
      delete clientObj.totalBudget;
      return res.status(200).json({
        success: true,
        data: clientObj,
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Update Client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    const clientToCheck = await Client.findById(req.params.id);
    if (!clientToCheck) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (isSocialMediaManagerUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Social Media Head has read-only access to clients",
      });
    }

    const isAssigned = clientToCheck.assignedTo && (
      Array.isArray(clientToCheck.assignedTo)
        ? clientToCheck.assignedTo.some(id => id.toString() === req.user._id.toString())
        : clientToCheck.assignedTo.toString() === req.user._id.toString()
    );

    if (!isPrivilegedClientUser(req.user) && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform CRUD operations on this client",
      });
    }

    if (req.body.branch !== undefined && (!req.body.branch || !req.body.branch.trim())) {
      return res.status(400).json({
        success: false,
        message: "Branch is required",
      });
    }

    if (isSocialMediaManagerUser(req.user) || req.body.budget === undefined) {
      delete req.body.budget;
      delete req.body.gst;
      delete req.body.totalBudget;
    } else {
      const budget = Number(req.body.budget);
      const gst = Number(req.body.gst);

      req.body.totalBudget =
        budget + (budget * gst) / 100;
    }

    // projectType / service are always derived from serviceDetails
    delete req.body.projectType;
    const plan = normalizeServicePlan(req.body.serviceDetails);
    if (plan?.error) {
      return res.status(400).json({ success: false, message: plan.error });
    }
    if (plan) {
      req.body.serviceDetails = plan.serviceDetails;
      req.body.service = plan.service;
      req.body.projectType = plan.projectType;
    }

    if (req.body.assignedTo) {
      req.body.assignedTo = Array.isArray(req.body.assignedTo)
        ? req.body.assignedTo.map(id => id._id || id)
        : [req.body.assignedTo._id || req.body.assignedTo];
    }

    const previousAssignees = clientToCheck.assignedTo ? clientToCheck.assignedTo.map(id => id.toString()) : [];

    const client =
      await Client.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          returnDocument: 'after',
          runValidators: true,
        }
      )
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role department");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Identify newly assigned members
    const currentAssignees = client.assignedTo ? client.assignedTo.map(u => (u._id || u).toString()) : [];
    const newAssignees = currentAssignees.filter(id => !previousAssignees.includes(id));

    if (newAssignees.length > 0) {
      const io = req.app.get("io");
      for (const memberId of newAssignees) {
        if (memberId !== req.user._id.toString()) {
          const notification = await Notification.create({
            recipient: memberId,
            sender: req.user._id,
            type: "client_assigned",
            message: `You have been assigned to Client: "${client.companyName}"`,
          });
          if (io) {
            const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
            io.to(memberId).emit("notification", populatedNotification);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Move a client from one executive to another (Client Split drag & drop).
//          Projects follow automatically (project access is based on client.assignedTo);
//          open tasks of that client are reassigned from the old executive to the new one.
// @route   PUT /api/clients/:id/reassign
// @access  Private (admin / operation manager / finance)
exports.reassignClient = async (req, res) => {
  try {
    if (!isPrivilegedClientUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reassign clients",
      });
    }

    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ success: false, message: "fromUserId and toUserId are required" });
    }
    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({ success: false, message: "Client is already with this executive" });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const toUser = await User.findById(toUserId).select("_id name");
    if (!toUser) {
      return res.status(404).json({ success: false, message: "Target executive not found" });
    }

    // Swap the executive in the client's team, keeping the rest (designers etc.) intact
    const ids = (client.assignedTo || []).map((id) => id.toString()).filter((id) => id !== fromUserId.toString());
    if (!ids.includes(toUserId.toString())) ids.push(toUserId.toString());
    client.assignedTo = ids;
    await client.save();

    // Reassign open tasks / subtasks of this client's projects from old -> new executive
    const projectIds = (await Project.find({ client: client._id }).select("_id").lean()).map((p) => p._id);
    const taskScope = { $or: [{ client: client._id }, { project: { $in: projectIds } }] };

    const taskResult = await Task.updateMany(
      { ...taskScope, assignedTo: fromUserId, status: { $ne: "Completed" } },
      { $set: { assignedTo: toUserId } }
    );
    const subtaskResult = await Task.updateMany(
      { ...taskScope, subtasks: { $elemMatch: { assignedTo: fromUserId, status: { $ne: "Completed" } } } },
      { $set: { "subtasks.$[s].assignedTo": toUserId } },
      { arrayFilters: [{ "s.assignedTo": fromUserId, "s.status": { $ne: "Completed" } }] }
    );

    const populated = await Client.findById(client._id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role department");

    // Record the move for the Client Split "Move History" tab
    let historyEntry = null;
    try {
      const fromUser = await User.findById(fromUserId).select("_id name");
      historyEntry = await ClientSplitHistory.create({
        client: client._id,
        clientName: client.companyName || "",
        branch: client.branch || "",
        fromUser: fromUser?._id || fromUserId,
        fromUserName: fromUser?.name || "",
        toUser: toUser._id,
        toUserName: toUser.name || "",
        movedBy: req.user._id,
        movedByName: req.user.name || "",
        movedTasks: taskResult.modifiedCount || 0,
        movedSubtasks: subtaskResult.modifiedCount || 0,
      });
    } catch (historyError) {
      console.error("Failed to save client split history:", historyError.message);
    }

    if (toUserId.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: toUserId,
        sender: req.user._id,
        type: "client_assigned",
        message: `You have been assigned to Client: "${client.companyName}"`,
      });
      const io = req.app.get("io");
      if (io) {
        const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
        io.to(toUserId.toString()).emit("notification", populatedNotification);
      }
    }

    res.status(200).json({
      success: true,
      data: populated,
      movedTasks: taskResult.modifiedCount || 0,
      movedSubtasks: subtaskResult.modifiedCount || 0,
      history: historyEntry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Client Split move history (newest first)
// @route   GET /api/clients/split-history
// @access  Private
exports.getClientSplitHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);
    const history = await ClientSplitHistory.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("fromUser", "name")
      .populate("toUser", "name")
      .populate("movedBy", "name")
      .lean();

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Delete Client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
  try {
    if (isSocialMediaManagerUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Social Media Head has read-only access to clients",
      });
    }

    const client = await Client.findById(
      req.params.id
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const isAssigned = client.assignedTo && (
      Array.isArray(client.assignedTo)
        ? client.assignedTo.some(id => id.toString() === req.user._id.toString())
        : client.assignedTo.toString() === req.user._id.toString()
    );

    if (!isPrivilegedClientUser(req.user) && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform CRUD operations on this client",
      });
    }

    await client.deleteOne();

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};