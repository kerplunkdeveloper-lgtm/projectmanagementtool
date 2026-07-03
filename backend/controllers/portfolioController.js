const Portfolio = require("../models/Portfolio");
const User = require("../models/User");

// @desc    Get all portfolios
// @route   GET /api/portfolios
// @access  Private
exports.getPortfolios = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin" && req.user.role !== "operationmanager") {
      const Client = require("../models/Client");
      const Project = require("../models/Project");

      // Find clients assigned to this user
      const assignedClients = await Client.find({ assignedTo: req.user._id }).select("_id");
      const clientIds = assignedClients.map(c => c._id);

      // Find projects of those clients
      const assignedProjects = await Project.find({ client: { $in: clientIds } }).select("_id");
      const projectIds = assignedProjects.map(p => p._id);

      const orConditions = [
        { projectIds: { $in: projectIds } }
      ];

      if (req.user.department) {
        const usersInSameDept = await User.find({ department: req.user.department }).select("_id");
        const userIds = usersInSameDept.map(u => u._id);
        orConditions.push({ createdBy: { $in: userIds } });
      } else {
        orConditions.push({ createdBy: req.user._id });
      }

      query = { $or: orConditions };
    }
    const portfolios = await Portfolio.find(query)
      .populate("projectIds", "name status client")
      .populate("client", "companyName")
      .populate("createdBy", "name department");
    res.status(200).json({ success: true, data: portfolios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a portfolio
// @route   POST /api/portfolios
// @access  Private/Admin
exports.createPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.create({
      ...req.body,
      createdBy: req.user._id,
    });
    const populatedPortfolio = await Portfolio.findById(portfolio._id)
      .populate("projectIds", "name status client")
      .populate("client", "companyName")
      .populate("createdBy", "name department");
    res.status(201).json({ success: true, data: populatedPortfolio });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update a portfolio (name, color, isFavorite, projectIds)
// @route   PUT /api/portfolios/:id
// @access  Private/Admin
exports.updatePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("projectIds", "name status client")
      .populate("client", "companyName")
      .populate("createdBy", "name department");

    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }

    res.status(200).json({ success: true, data: portfolio });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a portfolio
// @route   DELETE /api/portfolios/:id
// @access  Private/Admin
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }
    await portfolio.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add projects to a portfolio
// @route   PUT /api/portfolios/:id/projects
// @access  Private/Admin
exports.addProjectsToPortfolio = async (req, res) => {
  try {
    const { projectIds } = req.body; // array of project IDs to add
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }
    const merged = Array.from(
      new Set([
        ...portfolio.projectIds.map((id) => id.toString()),
        ...projectIds,
      ])
    );
    portfolio.projectIds = merged;
    await portfolio.save();
    const updated = await Portfolio.findById(req.params.id)
      .populate("projectIds", "name status client")
      .populate("client", "companyName");
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Remove a project from a portfolio
// @route   DELETE /api/portfolios/:id/projects/:projectId
// @access  Private/Admin
exports.removeProjectFromPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res
        .status(404)
        .json({ success: false, message: "Portfolio not found" });
    }
    portfolio.projectIds = portfolio.projectIds.filter(
      (pid) => pid.toString() !== req.params.projectId
    );
    await portfolio.save();
    const updated = await Portfolio.findById(req.params.id)
      .populate("projectIds", "name status client")
      .populate("client", "companyName");
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
