const Project = require("../models/Project");
const Notification = require("../models/Notification");

// @desc    Assign project to users
// @route   PUT /api/projects/:id/assign
// @access  Private (Admin & Operation Manager)
exports.assignProject = async (req, res) => {
  try {
    const { assignedTo } = req.body; // Expecting an array of user IDs

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true, runValidators: true }
    )
      .populate("client", "companyName")
      .populate("template", "title")
      .populate("assignedTo", "name email");

    // CREATE AND EMIT NOTIFICATIONS
    const io = req.app.get('io');
    
    // Convert to array if it's not
    const assignedUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    for (const userId of assignedUsers) {
      const notification = await Notification.create({
        recipient: userId,
        sender: req.user.id,
        type: 'project_assigned',
        message: `Strategic Deployment: You have been assigned to the project "${project.title}".`,
        project: project._id
      });

      if (io) {
        io.to(userId.toString()).emit('notification', notification);
      }
    }

    res.status(200).json({
      success: true,
      message: "Project assigned successfully",
      data: project,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};



// ==========================================
// GET ALL PROJECTS
// ==========================================

exports.getProjects =
  async (req, res) => {

    try {

      let query = {};



      // ADMIN -> ALL PROJECTS

      if (req.user.role !== "admin") {
        query = { assignedTo: req.user._id };
      }



      const projects =
        await Project.find(query)

          .populate(
            "client",
            "companyName"
          )

          .populate(
            "template",
            "title"
          )

          .populate(
            "createdBy",
            "name email"
          )

          .sort({
            createdAt: -1,
          });



      res.status(200).json({
        success: true,
        count: projects.length,
        data: projects,
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
};



// ==========================================
// GET SINGLE PROJECT
// ==========================================

exports.getProject =
  async (req, res) => {

    try {

      const project =
        await Project.findById(
          req.params.id
        )

          .populate(
            "client",
            "companyName"
          )

          .populate(
            "template",
            "title"
          )

          .populate(
            "createdBy",
            "name email"
          );



      if (!project) {

        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }



      res.status(200).json({
        success: true,
        data: project,
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
};



// ==========================================
// CREATE PROJECT
// ==========================================

exports.createProject =
  async (req, res) => {

    try {

      const {
        title,
        client,
        type,
        template,
        description,
        priority,
        startDate,
        endDate,
      } = req.body;



      const project =
        await Project.create({

          title,

          client,

          type,

          template,

          description,

          priority,

          startDate,

          endDate,

          createdBy:
            req.user._id,
        });



      const populatedProject =
        await Project.findById(
          project._id
        )

          .populate(
            "client",
            "companyName"
          )

          .populate(
            "template",
            "title"
          );



      res.status(201).json({
        success: true,
        message:
          "Project created successfully",
        data: populatedProject,
      });

    } catch (err) {

      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
};



// ==========================================
// UPDATE PROJECT
// ==========================================

exports.updateProject =
  async (req, res) => {

    try {

      let project =
        await Project.findById(
          req.params.id
        );



      if (!project) {

        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }



      project =
        await Project.findByIdAndUpdate(

          req.params.id,

          req.body,

          {
            new: true,
            runValidators: true,
          }
        )

          .populate(
            "client",
            "companyName"
          )

          .populate(
            "template",
            "title"
          );



      res.status(200).json({
        success: true,
        message:
          "Project updated successfully",
        data: project,
      });

    } catch (err) {

      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
};



// ==========================================
// DELETE PROJECT
// ==========================================

exports.deleteProject =
  async (req, res) => {

    try {

      const project =
        await Project.findById(
          req.params.id
        );



      if (!project) {

        return res.status(404).json({
          success: false,
          message:
            "Project not found",
        });
      }



      await project.deleteOne();



      res.status(200).json({
        success: true,
        message:
          "Project deleted successfully",
      });

    } catch (err) {

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
};