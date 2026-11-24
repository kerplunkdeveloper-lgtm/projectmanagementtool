// AWS S3 media storage helper.
// All NEW uploads go to S3. Old Cloudinary files are left untouched:
// their URLs stay in the DB as-is, and deleteMedia() routes Cloudinary
// files to Cloudinary so nothing breaks.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_BUCKET_NAME;
// Optional: set AWS_S3_PUBLIC_URL to a CloudFront domain (https://dxxxx.cloudfront.net)
const PUBLIC_BASE_URL = (process.env.AWS_S3_PUBLIC_URL || "").replace(/\/+$/, "");

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ensureConfigured = () => {
  if (!REGION || !BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS S3 is not configured. Check AWS_* values in .env");
  }
};

// Build the permanent public URL for a key
const getPublicUrl = (key) => {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  if (PUBLIC_BASE_URL) return `${PUBLIC_BASE_URL}/${encodedKey}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodedKey}`;
};

// Turn an S3 URL back into its key (used for delete/update)
const getKeyFromUrl = (url = "") => {
  try {
    const u = new URL(url);
    const isOurs =
      (PUBLIC_BASE_URL && url.startsWith(PUBLIC_BASE_URL)) ||
      u.hostname.startsWith(`${BUCKET}.s3`);
    if (!isOurs) return null;
    return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
};

const isCloudinaryUrl = (url = "") => /res\.cloudinary\.com/i.test(url);

const safeName = (name = "file") =>
  path
    .basename(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-100);

const removeTempFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

/**
 * CREATE / POST — upload a multer file to S3.
 * @param {object} file   multer file (req.file) — uses file.path or file.buffer
 * @param {string} folder e.g. "profiles", "chat_attachments"
 * @returns {{ key, public_id, url, secure_url, size, mimetype }}
 *          public_id/secure_url are returned so existing code shapes keep working.
 */
const uploadMedia = async (file, folder = "uploads") => {
  ensureConfigured();
  if (!file) throw new Error("No file provided");

  const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName(
    file.originalname
  )}`;
  const body = file.buffer ? file.buffer : fs.createReadStream(file.path);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: file.mimetype || "application/octet-stream",
        ContentLength: file.size,
        ContentDisposition: `inline; filename="${safeName(file.originalname)}"`,
      })
    );
  } finally {
    removeTempFile(file.path);
  }

  const url = getPublicUrl(key);
  return { key, public_id: key, url, secure_url: url, size: file.size, mimetype: file.mimetype };
};

/**
 * READ — temporary signed URL (works even if the bucket is private).
 */
const getMediaSignedUrl = async (keyOrUrl, expiresIn = 3600) => {
  ensureConfigured();
  const key = getKeyFromUrl(keyOrUrl) || keyOrUrl;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
};

/**
 * READ — check a file exists and get its metadata.
 */
const getMediaInfo = async (keyOrUrl) => {
  ensureConfigured();
  const key = getKeyFromUrl(keyOrUrl) || keyOrUrl;
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  return { key, size: head.ContentLength, mimetype: head.ContentType, lastModified: head.LastModified };
};

/**
 * DELETE — accepts { public_id, url } (DB shape), a key, or a URL.
 * Old Cloudinary files are sent to Cloudinary; S3 files to S3.
 * Never throws — a failed delete must not block the user action.
 */
const deleteMedia = async (media) => {
  if (!media) return false;
  const url = typeof media === "string" ? media : media.url || "";
  const id = typeof media === "string" ? media : media.public_id || "";

  try {
    if (isCloudinaryUrl(url)) {
      if (!id) return false;
      const cloudinary = require("./cloudinary");
      await cloudinary.uploader.destroy(id);
      return true;
    }

    ensureConfigured();
    const key = getKeyFromUrl(url) || getKeyFromUrl(id) || id;
    if (!key || /^https?:\/\//i.test(key)) return false;
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    console.error("deleteMedia error:", err.message || err);
    return false;
  }
};

/**
 * UPDATE — upload the new file, then delete the old one.
 * The old file is removed only after the new upload succeeds.
 */
const replaceMedia = async (oldMedia, newFile, folder) => {
  const uploaded = await uploadMedia(newFile, folder);
  await deleteMedia(oldMedia);
  return uploaded;
};

module.exports = {
  s3,
  uploadMedia,
  getMediaSignedUrl,
  getMediaInfo,
  deleteMedia,
  replaceMedia,
  getPublicUrl,
  getKeyFromUrl,
};
