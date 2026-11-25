const fs = require("fs");
const path = require("path");
const { ALLOWED_TYPES } = require("../config/rooms");

const startsWith = (buf, bytes, offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);

const SIGNATURE_CHECKS = {
  jpeg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38]),
  webp: (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8),
  pdf: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]), // %PDF
  zip: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]), // OOXML / ODF containers
  ole: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // legacy Office
  // Plain text: no NUL bytes in the sampled header.
  text: (b) => !b.includes(0x00),
};

const readHeader = (filePath, length = 8192) =>
  new Promise((resolve, reject) => {
    fs.open(filePath, "r", (err, fd) => {
      if (err) return reject(err);
      const buf = Buffer.alloc(length);
      fs.read(fd, buf, 0, length, 0, (readErr, bytesRead) => {
        fs.close(fd, () => {});
        if (readErr) return reject(readErr);
        resolve(buf.subarray(0, bytesRead));
      });
    });
  });

const getExtension = (name = "") => path.extname(name).replace(".", "").toLowerCase();

/** Fast pre-check used by multer's fileFilter (name based). */
const isAllowedName = (name) => Boolean(ALLOWED_TYPES[getExtension(name)]);

/**
 * Full server-side validation of an uploaded temp file.
 * Returns { ok: true, type, extension } or { ok: false, message }.
 */
const validateUploadedFile = async (file) => {
  const extension = getExtension(file.originalname);
  const type = ALLOWED_TYPES[extension];
  if (!type) {
    return { ok: false, message: `File type ".${extension || "?"}" is not allowed.` };
  }
  if (!file.size) {
    return { ok: false, message: "The file is empty." };
  }
  const header = await readHeader(file.path);
  const check = SIGNATURE_CHECKS[type.sig];
  if (!check || !check(header)) {
    return {
      ok: false,
      message: `The file content does not match its ".${extension}" extension.`,
    };
  }
  return { ok: true, type, extension };
};

/** Display-safe file name: strip path parts and control chars, cap length. */
const cleanDisplayName = (name = "file") =>
  path
    .basename(String(name))
    .replace(/[\u0000-\u001f\u007f"\\]/g, "")
    .trim()
    .slice(-200) || "file";

module.exports = { validateUploadedFile, isAllowedName, getExtension, cleanDisplayName };
