const DesignerEodReport = require("../models/DesignerEodReport");
const cloudinary = require("../config/cloudinary");

// ==========================================
// CREATE DESIGNER EOD REPORT
// ==========================================
exports.createDesignerEodReport = async (req, res) => {
  try {
    const report = await DesignerEodReport.create({
      ...req.body,
      user: req.user._id,
    });

    const populatedReport = await DesignerEodReport.findById(report._id).populate(
      "user",
      "name email role profile"
    );

    res.status(201).json({
      success: true,
      message: "Designer EOD Report submitted successfully",
      data: populatedReport,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// GET DESIGNER EOD REPORTS
// ==========================================
exports.getDesignerEodReports = async (req, res) => {
  try {
    let query = {};

    // If role is team, only show their own reports
    if (req.user.role === "team") {
      query = { user: req.user._id };
    }

    // Admins and Operation Managers can see all reports
    const reports = await DesignerEodReport.find(query)
      .populate("user", "name email role profile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// GET SINGLE DESIGNER EOD REPORT
// ==========================================
exports.getDesignerEodReport = async (req, res) => {
  try {
    const report = await DesignerEodReport.findById(req.params.id)
      .populate("user", "name email role profile");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Designer EOD Report not found",
      });
    }

    // Security check for team members
    if (req.user.role === "team" && report.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this report",
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// UPDATE DESIGNER EOD REPORT
// ==========================================
exports.updateDesignerEodReport = async (req, res) => {
  try {
    let report = await DesignerEodReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Designer EOD Report not found",
      });
    }

    // Ensure only the user who created it can update it
    if (report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this report",
      });
    }

    report = await DesignerEodReport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "name email profile");

    res.status(200).json({
      success: true,
      message: "Designer EOD Report updated successfully",
      data: report,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================================
// UPLOAD ATTACHMENT FOR DESIGNER EOD REPORT
// ==========================================
exports.uploadDesignerEodAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "designer_eod_attachments",
      resource_type: "auto",
    });

    let fileType = "document";
    const mime = req.file.mimetype;
    if (mime.startsWith("image/")) {
      fileType = "image";
    } else if (mime.startsWith("video/")) {
      fileType = "video";
    } else if (mime.startsWith("audio/")) {
      fileType = "audio";
    }

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        filename: req.file.originalname,
        fileType,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DELETE DESIGNER EOD REPORT
// ==========================================
exports.deleteDesignerEodReport = async (req, res) => {
  try {
    const report = await DesignerEodReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Designer EOD Report not found",
      });
    }

    // Ensure only the user who created it (or admin/operations) can delete it
    if (req.user.role === "team" && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this report",
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: "Designer EOD Report deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

