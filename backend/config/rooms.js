// Sorted Rooms configuration. Every limit can be overridden via environment
// variables so you can tune them without a code change. These are also
// exposed (read-only) to the frontend via GET /api/rooms/config so users
// always see the real limits.

const int = (name, fallback, min = 1) => {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v >= min ? v : fallback;
};

const MB = 1024 * 1024;

const roomConfig = {
  maxFileBytes: int("ROOM_MAX_FILE_MB", 25) * MB,
  maxRoomBytes: int("ROOM_MAX_TOTAL_MB", 250) * MB,
  maxFilesPerRoom: int("ROOM_MAX_FILES", 100),
  maxMembers: int("ROOM_MAX_MEMBERS", 25, 2),
  maxActiveRoomsPerHost: int("ROOM_MAX_ACTIVE_PER_HOST", 10),
  minExpiryMinutes: int("ROOM_MIN_EXPIRY_MINUTES", 15),
  maxExpiryHours: int("ROOM_MAX_EXPIRY_HOURS", 168), // 7 days
  notesMaxChars: int("ROOM_NOTES_MAX_CHARS", 20000),
  cleanupIntervalMinutes: int("ROOM_CLEANUP_INTERVAL_MINUTES", 5),
  // Failed join attempts allowed per user (and per IP) per window
  joinMaxFailures: int("ROOM_JOIN_MAX_FAILURES", 8),
  joinWindowMinutes: int("ROOM_JOIN_WINDOW_MINUTES", 15),
  signedUrlSeconds: int("ROOM_SIGNED_URL_SECONDS", 120, 30),
  // Bucket for room files. Defaults to the app's existing bucket; set a
  // dedicated private bucket (recommended) with ROOMS_S3_BUCKET.
  bucket: process.env.ROOMS_S3_BUCKET || process.env.AWS_BUCKET_NAME,
  keyPrefix: "sorted-rooms",
  meetingDomain: process.env.ROOM_MEETING_DOMAIN || "meet.jit.si",
};

// Allowed file types. The server decides the stored Content-Type from this
// table (never from the client), and verifies the file's leading bytes.
// sig: "jpeg" | "png" | ... checked in utils/roomFileValidation.js
const ALLOWED_TYPES = {
  jpg: { mime: "image/jpeg", sig: "jpeg", kind: "image", preview: true },
  jpeg: { mime: "image/jpeg", sig: "jpeg", kind: "image", preview: true },
  png: { mime: "image/png", sig: "png", kind: "image", preview: true },
  gif: { mime: "image/gif", sig: "gif", kind: "image", preview: true },
  webp: { mime: "image/webp", sig: "webp", kind: "image", preview: true },
  pdf: { mime: "application/pdf", sig: "pdf", kind: "pdf", preview: true },
  doc: { mime: "application/msword", sig: "ole", kind: "document" },
  xls: { mime: "application/vnd.ms-excel", sig: "ole", kind: "spreadsheet" },
  ppt: { mime: "application/vnd.ms-powerpoint", sig: "ole", kind: "presentation" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sig: "zip",
    kind: "document",
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sig: "zip",
    kind: "spreadsheet",
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    sig: "zip",
    kind: "presentation",
  },
  odt: { mime: "application/vnd.oasis.opendocument.text", sig: "zip", kind: "document" },
  ods: { mime: "application/vnd.oasis.opendocument.spreadsheet", sig: "zip", kind: "spreadsheet" },
  odp: { mime: "application/vnd.oasis.opendocument.presentation", sig: "zip", kind: "presentation" },
  txt: { mime: "text/plain", sig: "text", kind: "text" },
  csv: { mime: "text/csv", sig: "text", kind: "spreadsheet" },
};

const publicConfig = () => ({
  maxFileBytes: roomConfig.maxFileBytes,
  maxRoomBytes: roomConfig.maxRoomBytes,
  maxFilesPerRoom: roomConfig.maxFilesPerRoom,
  maxMembers: roomConfig.maxMembers,
  maxActiveRoomsPerHost: roomConfig.maxActiveRoomsPerHost,
  minExpiryMinutes: roomConfig.minExpiryMinutes,
  maxExpiryHours: roomConfig.maxExpiryHours,
  notesMaxChars: roomConfig.notesMaxChars,
  allowedExtensions: Object.keys(ALLOWED_TYPES),
  meetingDomain: roomConfig.meetingDomain,
});

module.exports = { roomConfig, ALLOWED_TYPES, publicConfig };
