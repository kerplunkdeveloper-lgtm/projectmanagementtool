const DesignerEodReport = require("../models/DesignerEodReport");
const cloudinary = require("../config/cloudinary");

// ==========================================
// CREATE DESIGNER EOD REPORT
// ==========================================
// ==========================================
// CREATE DESIGNER EOD REPORT (with Upsert logic by Date)
// ==========================================
exports.createDesignerEodReport = async (req, res) => {
  try {
    const { date, tasks, daySummary, isDraft } = req.body;

    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    let report = await DesignerEodReport.findOne({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (report) {
      // Update existing report
      if (tasks !== undefined) report.tasks = tasks;
      if (daySummary !== undefined) report.daySummary = daySummary;
      if (isDraft !== undefined) report.isDraft = isDraft;
      report.date = reportDate;
      await report.save();
    } else {
      // Create new report
      report = await DesignerEodReport.create({
        user: req.user._id,
        date: reportDate,
        tasks: tasks || [],
        daySummary: daySummary || { toolsIssues: "", clientCalls: "", anythingElseOps: "" },
        isDraft: isDraft !== undefined ? isDraft : true,
      });
    }

    // Sync task status and revisions back to Task collection in the database
    if (tasks && tasks.length > 0) {
      const Task = require("../models/Task");
      for (const t of tasks) {
        if (t.taskId) {
          const updateData = {};
          if (t.statusAtEod) {
            updateData.status = t.statusAtEod;
          }
          if (t.revisions !== undefined) {
            updateData.revisions = t.revisions;
          }
          await Task.findByIdAndUpdate(t.taskId, updateData);
        }
      }
    }

    const populatedReport = await DesignerEodReport.findById(report._id)
      .populate("user", "name email role profile department")
      .populate("tasks.reviewedBy", "name email role profile department");

    // Notify admins, operation managers, and social media managers only if submitted (not draft)
    if (!isDraft) {
      try {
        const User = require("../models/User");
        const Notification = require("../models/Notification");
        const recipients = await User.find({
          $or: [
            { role: { $in: ["admin", "operationmanager"] } },
            { department: { $regex: /social media manager/i } }
          ]
        });
        
        const io = req.app.get("io");
        const senderName = req.user.name || "A designer";
        
        for (const recipient of recipients) {
          if (recipient._id.toString() === req.user._id.toString()) continue;
          
          const notification = await Notification.create({
            recipient: recipient._id,
            sender: req.user._id,
            type: "report_submitted",
            message: `${senderName} submitted a new Designer EOD Report`,
          });
          
          if (io) {
            const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
            io.to(recipient._id.toString()).emit("notification", populatedNotification);
          }
        }
      } catch (notifErr) {
        console.error("Failed to send designer EOD report notifications:", notifErr);
      }
    }

    res.status(201).json({
      success: true,
      message: isDraft ? "Designer EOD Report draft saved successfully" : "Designer EOD Report submitted successfully",
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
// GET DESIGNER EOD REPORTS (with date/query filters)
// ==========================================
exports.getDesignerEodReports = async (req, res) => {
  try {
    let query = {};

    // If role is team, only show their own reports, unless they are a Social Media Manager
    if (req.user.role === "team" && req.user.department?.toLowerCase() !== "social media manager") {
      query.user = req.user._id;
    }

    // Filter by specific user if provided (e.g. by admin)
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    // Filter by Date
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Admins and Operation Managers can see all reports
    const reports = await DesignerEodReport.find(query)
      .populate("user", "name email role profile department")
      .populate("tasks.reviewedBy", "name email role profile department")
      .sort({ date: -1, createdAt: -1 });

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
      .populate("user", "name email role profile department")
      .populate("tasks.reviewedBy", "name email role profile department");

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
    })
      .populate("user", "name email profile department")
      .populate("tasks.reviewedBy", "name email profile department");

    // Sync task status and revisions back to Task collection in the database
    if (req.body.tasks && req.body.tasks.length > 0) {
      const Task = require("../models/Task");
      for (const t of req.body.tasks) {
        if (t.taskId) {
          const updateData = {};
          if (t.statusAtEod) {
            updateData.status = t.statusAtEod;
          }
          if (t.revisions !== undefined) {
            updateData.revisions = t.revisions;
          }
          await Task.findByIdAndUpdate(t.taskId, updateData);
        }
      }
    }

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

