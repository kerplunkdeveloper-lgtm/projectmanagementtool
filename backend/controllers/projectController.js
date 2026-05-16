const Project =
  require("../models/Project");



// ==========================================
// GET ALL PROJECTS
// ==========================================

exports.getProjects =
  async (req, res) => {

    try {

      let query = {};



      // ADMIN -> ALL PROJECTS

      if (
        req.user.role !== "admin"
      ) {

        query = {
          createdBy:
            req.user._id,
        };
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

// ==========================================
// ASSIGN PROJECT
// ==========================================
exports.assignProject = async (req, res) => {
  try {
    const { assignedTo } = req.body;

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