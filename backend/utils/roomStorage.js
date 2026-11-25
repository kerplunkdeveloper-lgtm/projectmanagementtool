// Private storage for Sorted Rooms files, built on the app's existing S3 client.
// - Objects are written WITHOUT a public ACL under "sorted-rooms/<roomId>/".
// - Object keys contain 192 random bits and no file name, so they are not guessable
//   even if a bucket policy were to allow public reads (see setup notes).
// - Browsers only ever receive short-lived presigned URLs, issued after a
//   server-side membership check.

const fs = require("fs");
const crypto = require("crypto");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config/s3");
const { roomConfig } = require("../config/rooms");

const ensureConfigured = () => {
  if (
    !process.env.AWS_REGION ||
    !roomConfig.bucket ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    const err = new Error("File storage is not configured on the server.");
    err.statusCode = 503;
    throw err;
  }
};

const roomPrefix = (roomId) => `${roomConfig.keyPrefix}/${roomId}/`;

const encodeRFC5987 = (str) =>
  encodeURIComponent(str).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

const contentDisposition = (type, fileName) => {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeRFC5987(fileName)}`;
};

/** Upload a multer temp file. Returns { bucket, key }. Always removes the temp file. */
const putRoomFile = async (roomId, file, mimeType) => {
  ensureConfigured();
  const key = `${roomPrefix(roomId)}${crypto.randomBytes(24).toString("hex")}`;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: roomConfig.bucket,
        Key: key,
        Body: fs.createReadStream(file.path),
        ContentLength: file.size,
        ContentType: mimeType,
        ContentDisposition: "attachment",
        ServerSideEncryption: "AES256",
        CacheControl: "private, no-store",
      })
    );
  } finally {
    fs.unlink(file.path, () => {});
  }
  return { bucket: roomConfig.bucket, key };
};

/** Short-lived signed URL. mode "preview" renders inline (only for previewable types). */
const getRoomFileUrl = async (fileDoc, { inline }) => {
  ensureConfigured();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: fileDoc.bucket,
      Key: fileDoc.storageKey,
      ResponseContentType: fileDoc.mimeType,
      ResponseContentDisposition: contentDisposition(inline ? "inline" : "attachment", fileDoc.originalName),
      ResponseCacheControl: "private, no-store",
    }),
    { expiresIn: roomConfig.signedUrlSeconds }
  );
};

/** Deletes one object. Throws on failure so callers can retry later. */
const deleteRoomObject = async (bucket, key) => {
  ensureConfigured();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

/** Deletes every object under a room's prefix (catches orphans from failed uploads). */
const deleteRoomPrefix = async (roomId) => {
  ensureConfigured();
  const Prefix = roomPrefix(roomId);
  let ContinuationToken;
  do {
    const listed = await s3.send(
      new ListObjectsV2Command({ Bucket: roomConfig.bucket, Prefix, ContinuationToken })
    );
    const objects = (listed.Contents || []).map((o) => ({ Key: o.Key }));
    if (objects.length) {
      const res = await s3.send(
        new DeleteObjectsCommand({
          Bucket: roomConfig.bucket,
          Delete: { Objects: objects, Quiet: true },
        })
      );
      if (res.Errors && res.Errors.length) {
        throw new Error(`Failed to delete ${res.Errors.length} room objects`);
      }
    }
    ContinuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (ContinuationToken);
};

module.exports = { putRoomFile, getRoomFileUrl, deleteRoomObject, deleteRoomPrefix };
