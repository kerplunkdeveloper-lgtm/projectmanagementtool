const Client = require("../models/Client");


// @desc    Create Client
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    // Removed admin check to allow other authorized roles to create clients

    const {
      companyName,
      industry,
      phoneNumber,
      email,
      budget,
      gst,
      service,
      reels,
      posts,
      videos,
      needDslr,
      pages,
      onpage,
      offpage,
      assignedTo,
    } = req.body;

    const totalBudget =
      Number(budget) +
      (Number(budget) * Number(gst)) / 100;

    const client = await Client.create({
      companyName,
      industry,
      phoneNumber,
      email,
      budget,
      gst,
      totalBudget,
      service,
      reels,
      posts,
      videos,
      needDslr,
      pages,
      onpage,
      offpage,
      createdBy: req.user._id,
      assignedTo: req.user.role !== "admin" ? req.user._id : (assignedTo || undefined),
    });

    const populatedClient = await Client.findById(client._id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

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
    if (req.user.role !== "admin") {
      query.assignedTo = req.user._id;
    }

    const clients = await Client.find(query)
      .populate(
        "createdBy",
        "name email role"
      )
      .populate(
        "assignedTo",
        "name email role"
      )
      .sort({ createdAt: -1 });

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
      .populate("assignedTo", "name email role");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (req.user.role !== "admin" && (!client.assignedTo || client.assignedTo._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this client",
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

    if (req.user.role !== "admin" && (!clientToCheck.assignedTo || clientToCheck.assignedTo.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform CRUD operations on this client",
      });
    }

    const budget = Number(req.body.budget);
    const gst = Number(req.body.gst);

    req.body.totalBudget =
      budget + (budget * gst) / 100;

    const client =
      await Client.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
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


// @desc    Delete Client
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(
      req.params.id
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (req.user.role !== "admin" && (!client.assignedTo || client.assignedTo.toString() !== req.user._id.toString())) {
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