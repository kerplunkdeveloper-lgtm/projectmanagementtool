const ContentCalendar = require("../models/ContentCalendar");
const Client = require("../models/Client");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// @desc    Get content calendar summary/stats per client
// @route   GET /api/content-calendar/summary
// @access  Private
exports.getContentCalendarSummary = async (req, res) => {
  try {
    const summary = await ContentCalendar.aggregate([
      {
        $group: {
          _id: "$client",
          totalPosts: { $sum: 1 },
          planned: {
            $sum: { $cond: [{ $eq: ["$status", "Planned"] }, 1, 0] },
          },
          scheduled: {
            $sum: { $cond: [{ $eq: ["$status", "Scheduled"] }, 1, 0] },
          },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "Published"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error in getContentCalendarSummary:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to fetch summary",
      error: error.message,
    });
  }
};

// @desc    Get content calendar posts
// @route   GET /api/content-calendar
// @access  Private
exports.getContentCalendarPosts = async (req, res) => {
  try {
    const { client, startDate, endDate, month, year, status, category } = req.query;

    const filter = {};

    if (client) {
      filter.client = client;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10) - 1; // 0-indexed in JS Date
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      filter.scheduledDate = { $gte: start, $lte: end };
    }

    const posts = await ContentCalendar.find(filter)
      .populate("client", "companyName industry color icon")
      .populate("createdBy", "name email role department profile profileImage")
      .populate("updatedBy", "name email role department profile profileImage")
      .sort({ scheduledDate: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error("Error in getContentCalendarPosts:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to fetch content calendar posts",
      error: error.message,
    });
  }
};

// @desc    Get single post by ID
// @route   GET /api/content-calendar/:id
// @access  Private
exports.getContentCalendarPostById = async (req, res) => {
  try {
    const post = await ContentCalendar.findById(req.params.id)
      .populate("client", "companyName industry color icon")
      .populate("createdBy", "name email role department profile profileImage")
      .populate("updatedBy", "name email role department profile profileImage");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Content calendar post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error in getContentCalendarPostById:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to fetch post",
      error: error.message,
    });
  }
};

// @desc    Create a content calendar post
// @route   POST /api/content-calendar
// @access  Private
exports.createContentCalendarPost = async (req, res) => {
  try {
    const {
      client,
      title,
      content,
      scheduledDate,
      time,
      category,
      platform,
      status,
      media,
      tags,
      notes,
      color,
    } = req.body;

    if (!client || !title || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Client, title, and scheduledDate are required fields",
      });
    }

    // Verify client exists
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({
        success: false,
        message: "Selected client not found",
      });
    }

    const post = await ContentCalendar.create({
      client,
      title,
      content: content || "",
      scheduledDate: new Date(scheduledDate),
      time: time || "10:00 AM",
      category: category || "Static Post",
      platform: Array.isArray(platform) && platform.length > 0 ? platform : ["Instagram"],
      status: status || "Planned",
      media: Array.isArray(media) ? media : [],
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : [],
      notes: notes || "",
      color: color || clientExists.color || "#3b82f6",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const populatedPost = await ContentCalendar.findById(post._id)
      .populate("client", "companyName industry color icon")
      .populate("createdBy", "name email role department profile profileImage");

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: "Content calendar post created successfully",
    });
  } catch (error) {
    console.error("Error in createContentCalendarPost:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to create content calendar post",
      error: error.message,
    });
  }
};

// @desc    Bulk create/import content calendar posts
// @route   POST /api/content-calendar/bulk
// @access  Private
exports.bulkCreateContentCalendarPosts = async (req, res) => {
  try {
    const { client, posts } = req.body;

    if (!client || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Client ID and an array of posts are required",
      });
    }

    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({
        success: false,
        message: "Selected client not found",
      });
    }

    const postsToInsert = posts.map((p) => ({
      client,
      title: p.title || "Untitled Post",
      content: p.content || "",
      link: p.link || "",
      scheduledDate: p.scheduledDate ? new Date(p.scheduledDate) : new Date(),
      time: p.time || "10:00 AM",
      category: p.category || "Post",
      platform: Array.isArray(p.platform) && p.platform.length > 0 ? p.platform : ["Instagram"],
      status: p.status || "Planned",
      media: Array.isArray(p.media) ? p.media : [],
      tags: Array.isArray(p.tags) ? p.tags : typeof p.tags === "string" ? p.tags.split(",").map((t) => t.trim()) : [],
      notes: p.notes || "",
      color: p.color || clientExists.color || "#3b82f6",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    }));

    const inserted = await ContentCalendar.insertMany(postsToInsert);

    res.status(201).json({
      success: true,
      count: inserted.length,
      data: inserted,
      message: `Successfully imported ${inserted.length} content calendar posts`,
    });
  } catch (error) {
    console.error("Error in bulkCreateContentCalendarPosts:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to bulk import posts",
      error: error.message,
    });
  }
};

// @desc    Upload media for content calendar
// @route   POST /api/content-calendar/upload-media
// @access  Private
exports.uploadContentCalendarMedia = async (req, res) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image or video file",
      });
    }

    const files = req.files || [req.file];
    const uploadedMedia = [];

    for (const file of files) {
      if (cloudinary && cloudinary.uploader) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "content-calendar",
            resource_type: "auto",
          });

          // Clean up local temp file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          uploadedMedia.push({
            url: result.secure_url || result.url,
            public_id: result.public_id,
            mediaType: result.resource_type || (file.mimetype.startsWith("video") ? "video" : "image"),
            filename: file.originalname,
            size: file.size,
          });
          continue;
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed, falling back to local/base64 path", uploadErr);
        }
      }

      // Fallback
      uploadedMedia.push({
        url: `/uploads/${file.filename}`,
        public_id: file.filename,
        mediaType: file.mimetype.startsWith("video") ? "video" : "image",
        filename: file.originalname,
        size: file.size,
      });
    }

    res.status(200).json({
      success: true,
      data: uploadedMedia,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    console.error("Error in uploadContentCalendarMedia:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to upload media",
      error: error.message,
    });
  }
};

// @desc    Update a content calendar post
// @route   PUT /api/content-calendar/:id
// @access  Private
exports.updateContentCalendarPost = async (req, res) => {
  try {
    let post = await ContentCalendar.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Content calendar post not found",
      });
    }

    const updates = { ...req.body, updatedBy: req.user._id };
    if (updates.scheduledDate) {
      updates.scheduledDate = new Date(updates.scheduledDate);
    }

    post = await ContentCalendar.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("client", "companyName industry color icon")
      .populate("createdBy", "name email role department profile profileImage")
      .populate("updatedBy", "name email role department profile profileImage");

    res.status(200).json({
      success: true,
      data: post,
      message: "Content calendar post updated successfully",
    });
  } catch (error) {
    console.error("Error in updateContentCalendarPost:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to update post",
      error: error.message,
    });
  }
};

// @desc    Delete a single post
// @route   DELETE /api/content-calendar/:id
// @access  Private
exports.deleteContentCalendarPost = async (req, res) => {
  try {
    const post = await ContentCalendar.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Content calendar post not found",
      });
    }

    // Optional: delete media from cloudinary
    if (post.media && Array.isArray(post.media)) {
      for (const m of post.media) {
        if (m.public_id && cloudinary && cloudinary.uploader) {
          try {
            await cloudinary.uploader.destroy(m.public_id);
          } catch (e) {}
        }
      }
    }

    await ContentCalendar.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: "Content calendar post deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteContentCalendarPost:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to delete post",
      error: error.message,
    });
  }
};

// @desc    Clear all posts for a client
// @route   DELETE /api/content-calendar/client/:clientId
// @access  Private
exports.clearClientCalendar = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { client: clientId };
    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const result = await ContentCalendar.deleteMany(filter);

    res.status(200).json({
      success: true,
      count: result.deletedCount,
      message: `Successfully cleared ${result.deletedCount} posts from calendar`,
    });
  } catch (error) {
    console.error("Error in clearClientCalendar:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Failed to clear calendar",
      error: error.message,
    });
  }
};
