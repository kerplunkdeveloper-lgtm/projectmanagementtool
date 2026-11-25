const express = require("express");
const os = require("os");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");
const { roomConfig } = require("../config/rooms");
const { isAllowedName } = require("../utils/roomFileValidation");
const ctrl = require("../controllers/roomController");

const router = express.Router();

// Every Sorted Rooms endpoint requires a signed-in Sorted user.
router.use(protect);

// Room payloads contain secrets (codes, meeting names, signed URLs): never cache.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// ---- Join brute-force protection: only FAILED attempts count ----
const joinLimitHandler = (req, res) =>
  res.status(429).json({
    success: false,
    message: `Too many incorrect codes. Try again in ${roomConfig.joinWindowMinutes} minutes.`,
  });

const joinLimiterPerUser = rateLimit({
  windowMs: roomConfig.joinWindowMinutes * 60 * 1000,
  max: roomConfig.joinMaxFailures,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `room-join-user:${req.user._id}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: joinLimitHandler,
});

const joinLimiterPerIp = rateLimit({
  windowMs: roomConfig.joinWindowMinutes * 60 * 1000,
  max: roomConfig.joinMaxFailures * 4, // shared offices sit behind one IP
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `room-join-ip:${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: joinLimitHandler,
});

// ---- Uploads: temp disk storage, size + name pre-filter (content verified in controller) ----
const roomUpload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: roomConfig.maxFileBytes, files: 1, fields: 5 },
  fileFilter: (req, file, cb) => {
    if (isAllowedName(file.originalname)) return cb(null, true);
    const err = new Error("This file type is not allowed.");
    err.code = "ROOM_FILE_TYPE";
    cb(err);
  },
});

const handleUpload = (req, res, next) =>
  roomUpload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: `Files must be ${Math.round(roomConfig.maxFileBytes / 1048576)} MB or smaller.`,
      });
    }
    if (err.code === "ROOM_FILE_TYPE") {
      return res.status(415).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: "Upload could not be processed." });
  });

router.get("/config", ctrl.getConfig);
router.get("/", ctrl.listRooms);
router.post("/", ctrl.createRoom);
router.post("/join", joinLimiterPerIp, joinLimiterPerUser, ctrl.joinRoom);

router.get("/:id", ctrl.getRoom);
router.patch("/:id", ctrl.updateRoom);
router.delete("/:id", ctrl.endRoom);
router.post("/:id/rotate-code", ctrl.rotateCode);
router.post("/:id/rotate-meeting", ctrl.rotateMeeting);
router.post("/:id/leave", ctrl.leaveRoom);
router.delete("/:id/members/:userId", ctrl.removeMember);
router.put("/:id/notes", ctrl.updateNotes);

router.get("/:id/files", ctrl.listFiles);
router.post("/:id/files", ctrl.preUpload, handleUpload, ctrl.uploadFile);
router.get("/:id/files/:fileId/url", ctrl.getFileUrl);
router.delete("/:id/files/:fileId", ctrl.deleteFile);

module.exports = router;
