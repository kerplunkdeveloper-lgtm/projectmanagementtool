# Sorted Rooms: implementation & setup notes

Temporary, invite-only rooms for sharing files, shared notes and a voice/video meeting.
Built on the existing Sorted stack: Express + MongoDB (Mongoose), JWT `protect`
middleware, the existing AWS S3 client (`config/s3.js`), and socket.io.

## What was added

| Area | Files |
| --- | --- |
| Config / limits | `config/rooms.js` |
| Models | `models/SortedRoom.js`, `models/RoomFile.js` (new collections `sortedrooms`, `roomfiles`; no migration needed) |
| API | `routes/roomRoutes.js`, `controllers/roomController.js`, mounted at `/api/rooms` in `server.js` |
| Security helpers | `utils/roomSecurity.js` (codes, meeting names), `utils/roomFileValidation.js` (type + magic-byte checks) |
| Storage | `utils/roomStorage.js` (private S3 objects, presigned URLs) |
| Cleanup job | `utils/roomCleanupScheduler.js`, started in `server.js` |
| Frontend | `frontend/src/pages/rooms/*`, `frontend/src/services/roomService.js`, routes in `AppRoutes.jsx`, "Rooms" in `sidebarConfig.js`, invite redirect after login in `Login.jsx` |

## API (all require a signed-in Sorted user)

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/rooms/config` | any user: limits shown in the UI |
| GET | `/api/rooms` | rooms you belong to |
| POST | `/api/rooms` | any user: `{ name, clientLabel?, expiresInMinutes }` |
| POST | `/api/rooms/join` | any user: `{ code }`, rate-limited on failures |
| GET | `/api/rooms/:id` | member |
| PATCH | `/api/rooms/:id` | host: name, clientLabel, locked, permissions, expiresInMinutes |
| DELETE | `/api/rooms/:id` | host: ends the room and deletes everything |
| POST | `/api/rooms/:id/rotate-code` | host: old code stops working immediately |
| POST | `/api/rooms/:id/rotate-meeting` | host: new external meeting name |
| DELETE | `/api/rooms/:id/members/:userId` | host: removes and blocks rejoining |
| POST | `/api/rooms/:id/leave` | non-host member |
| PUT | `/api/rooms/:id/notes` | member (if allowed): `{ content, version }` (409 on conflict) |
| GET | `/api/rooms/:id/files` | member |
| POST | `/api/rooms/:id/files` | member (if uploads allowed): multipart `file` |
| GET | `/api/rooms/:id/files/:fileId/url?mode=preview\|download` | member: short-lived signed URL |
| DELETE | `/api/rooms/:id/files/:fileId` | host, or uploader if allowed |

Non-members always get `404` (a room's existence is not revealed). Members of an
expired or ended room get `410`.

## Security model

- **Authentication / roles:** uses the existing `protect` middleware. Any active
  Sorted user (every existing role) can create or join a room. Room access is
  decided only by room membership. Admins do **not** get automatic access to other
  people's rooms, and no existing route or permission was changed.
- **Room codes:** 12 characters from a 31-symbol unambiguous alphabet, generated with
  `crypto.randomInt` (about 59 bits). Codes are `select: false` in Mongo and are only
  returned to members. Hosts can **change the code** (old code dies immediately),
  **lock** the room (no new joins), and **remove** members (they're blocked from rejoining).
- **Brute force:** failed joins are limited per user *and* per IP
  (`ROOM_JOIN_MAX_FAILURES`, default 8 per user / 32 per IP per 15 minutes). Successful
  joins don't count. The limiter store is in-memory, so with multiple backend instances
  each instance counts separately. Use a shared store (e.g. Redis) if you scale out.
- **Invite links:** `https://<app>/rooms/join#code=XXXX-XXXX-XXXX`. The code is in the
  URL *fragment*, which browsers never send to servers (so it isn't written to Vercel or
  proxy logs). It's removed from the address bar immediately, and the user must still sign in.
- **Files:**
  - Uploads are checked for membership and quota *before* anything is written to disk.
  - Size is limited by multer, and the type comes from an extension allow-list.
  - The leading bytes are verified (a renamed `.html` → `.pdf` is rejected).
  - The stored `Content-Type` is set by the server, never by the client. SVG and HTML aren't allowed.
  - Objects are written without a public ACL, with SSE-S3 encryption, under
    `sorted-rooms/<roomId>/<192 random bits>` (no file name in the key).
  - Downloads use presigned URLs that expire after `ROOM_SIGNED_URL_SECONDS` (default 120)
    and are issued only after a membership check. No AWS keys reach the browser.
- **Real-time updates:** socket.io only sends content-free pings
  (`sorted-room:changed {roomId, kind}`). Clients then refetch through the authenticated API.
  This matters because the app's existing socket `join` event trusts a client-supplied
  user ID (a pre-existing weakness, unchanged here). So no room data is ever sent over sockets.
- **Expiry & deletion:** enforced on the server for every request, not just in the UI.
  `utils/roomCleanupScheduler.js` runs every `ROOM_CLEANUP_INTERVAL_MINUTES` (default 5):
  - It marks expired or ended rooms as ended.
  - It deletes each stored object, then sweeps the room's S3 prefix for orphans.
  - It then deletes the file records and the room record.
  - If S3 deletion fails, the records are kept and the job retries on the next run.
  - Ending a room as host also purges it immediately.

## Meeting (Jitsi Meet, public `meet.jit.si`)

- The page loads `https://meet.jit.si/external_api.js` only when someone clicks *Start
  or join meeting*, then embeds the meeting with the IFrame API. It has its own mic,
  camera, screen-share and leave controls, a device/permission check, and handling for
  failed script loads and dropped connections. There's also an "open in new tab" fallback.
- Each room gets its own meeting name: `Sorted` + 160 random bits (hex). It contains no
  room, client or user data, and the meeting subject is the generic "Sorted meeting".
  Only the user's display name is sent to Jitsi.
- **Limitation, stated plainly in the UI:** Sorted room access does **not** control meeting
  access. Anyone who obtains the meeting link can join. The public service can't be locked
  to Sorted users from this app, and meetings are **not** end-to-end private by default.
  The long random name only makes the meeting hard to guess. Hosts can *Reset meeting link*
  if it leaks, or after removing a member.
- Per Jitsi's 2023 change (reported by third-party sources; verify against Jitsi's own
  announcement), the person who starts a `meet.jit.si` meeting must sign in to meet.jit.si
  (Google/GitHub/etc.); guests can join without an account. The public service is free,
  provided as-is with no SLA, and its terms limit no-cost use (check the current terms
  before relying on it).
- To restrict meetings to Sorted members later, use a deployment with JWT auth: either
  8x8 JaaS (has a limited free tier; check current plan limits) or a self-hosted Jitsi
  server. Then set `ROOM_MEETING_DOMAIN` and add server-side JWT minting. That isn't
  implemented here because it needs an account or server you'd have to create.

## Configuration (backend `.env`; all optional, defaults shown)

```env
# Storage: reuses the existing AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_BUCKET_NAME
ROOMS_S3_BUCKET=             # recommended: a dedicated PRIVATE bucket for room files
ROOM_MAX_FILE_MB=25
ROOM_MAX_TOTAL_MB=250        # per room
ROOM_MAX_FILES=100           # per room
ROOM_MAX_MEMBERS=25
ROOM_MAX_ACTIVE_PER_HOST=10
ROOM_MIN_EXPIRY_MINUTES=15
ROOM_MAX_EXPIRY_HOURS=168    # 7 days
ROOM_NOTES_MAX_CHARS=20000
ROOM_CLEANUP_INTERVAL_MINUTES=5
ROOM_JOIN_MAX_FAILURES=8
ROOM_JOIN_WINDOW_MINUTES=15
ROOM_SIGNED_URL_SECONDS=120
ROOM_MEETING_DOMAIN=meet.jit.si
```

The frontend needs no new environment variables or secrets.

## Required S3 setup (do this before enabling in production)

1. **Make sure room files are not publicly readable.** The existing app builds public S3
   URLs for other uploads, so the main bucket may have a public-read bucket policy. Either:
   - set `ROOMS_S3_BUCKET` to a new bucket with *Block all public access* turned on
     (recommended), or
   - make sure the existing bucket's public-read policy does **not** cover `sorted-rooms/*`.
   Room object keys are unguessable either way, but they should not rely on that alone.
2. **IAM permissions** for the app's access key on the rooms bucket:
   `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::<bucket>/sorted-rooms/*`,
   and `s3:ListBucket` on `arn:aws:s3:::<bucket>` (prefix `sorted-rooms/`).
3. **Safety-net lifecycle rule (recommended):** expire objects under prefix `sorted-rooms/`
   after 8 days (max room lifetime + 1). This catches anything the cleanup job misses
   if the server is down for a long time.
4. No CORS changes are needed: files open by navigation or `<img>`, not `fetch`.

## Costs / free-tier notes

- **MongoDB:** two small collections. Room and file records are deleted on expiry.
- **AWS S3:** uses your existing AWS account. Storage, requests and data transfer are
  billed beyond whatever free-tier allowance or credits your account has. This is not
  unlimited free usage. The per-file, per-room and per-host limits above bound the worst case.
- **meet.jit.si:** free public service with no SLA and usage terms. See above.

## Known limitations

- Join rate limiting and the cleanup job's "running" guard are per process.
- Shared notes use last-writer-wins with version checks. Conflicts are detected and shown
  (load latest / keep mine), but this isn't character-level co-editing.
- Room files aren't virus-scanned. Only allow-listed types with matching signatures are accepted.
