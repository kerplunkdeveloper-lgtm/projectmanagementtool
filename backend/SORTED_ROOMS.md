# Sorted Rooms: implementation & setup notes

Temporary, invite-only rooms for sharing files and real-time shared notes.
Built on the existing Sorted stack: Express + MongoDB (Mongoose), JWT `protect`
middleware, the existing AWS S3 client (`config/s3.js`), and socket.io.

## What was added

| Area | Files |
| --- | --- |
| Config / limits | `config/rooms.js` |
| Models | `models/SortedRoom.js`, `models/RoomFile.js` (new collections `sortedrooms`, `roomfiles`; no migration needed) |
| API | `routes/roomRoutes.js`, `controllers/roomController.js`, mounted at `/api/rooms` in `server.js` |
| Real-time notes | `utils/roomSocket.js` (JWT-authenticated socket channel), `diff-match-patch` merging in the controller and `NotesTab.jsx` |
| Security helpers | `utils/roomSecurity.js` (room codes), `utils/roomFileValidation.js` (type + magic-byte checks) |
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
| DELETE | `/api/rooms/:id/members/:userId` | host: removes and blocks rejoining |
| POST | `/api/rooms/:id/leave` | non-host member |
| PUT | `/api/rooms/:id/notes` | member (if allowed): `{ patch, clientId }`, merged into the latest text |
| POST | `/api/rooms/:id/notes/seen` | member: `{ seq }`, marks notes updates as seen |
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
- **Real-time updates:** per-user socket rooms only get content-free pings
  (`sorted-room:changed {roomId, kind}`). Clients then refetch through the authenticated API.
  This matters because the app's existing socket `join` event trusts a client-supplied
  user ID (a pre-existing weakness, unchanged here). Notes content travels only on the
  private channel described below.
- **Expiry & deletion:** enforced on the server for every request, not just in the UI.
  `utils/roomCleanupScheduler.js` runs every `ROOM_CLEANUP_INTERVAL_MINUTES` (default 5):
  - It marks expired or ended rooms as ended.
  - It deletes each stored object, then sweeps the room's S3 prefix for orphans.
  - It then deletes the file records and the room record.
  - If S3 deletion fails, the records are kept and the job retries on the next run.
  - Ending a room as host also purges it immediately.

## Real-time shared notes

- **Channel auth:** the browser subscribes with `sorted-room:subscribe { roomId, token }`.
  The server verifies the JWT, the account status and room membership before adding the
  socket to the private channel `sroom:<roomId>`. Removed or departed members are evicted,
  and the channel closes when the room ends. Unauthenticated sockets can't receive notes
  or send typing events.
- **Saving & merging:** each browser keeps the last server text it knows. About 350 ms after
  the last keystroke it sends a `diff-match-patch` patch over the authenticated REST API.
  The server applies the patch to the *current* text, so two people typing at once are merged
  rather than overwritten. It saves with an atomic version check (retrying on races) and
  pushes the merged text to the channel. Browsers merge it with any unsent typing and keep
  the caret in place.
- **Typing indicator:** "Name is typing…", throttled on both client and server.
- **Unread badges (seen / not seen):**
  - Edits are grouped into "updates": a new update starts when a different person edits,
    or after a pause of `ROOM_NOTES_EDIT_GAP_SECONDS` (default 120).
  - Each member stores the last update they've seen. The Shared Notes tab, the Rooms list
    card and the browser tab title show the unseen count.
  - Opening the notes tab marks updates as seen. The notes footer shows who has and hasn't
    seen the latest update.
- **Fallback:** if the socket is unavailable, the notes tab polls every 5 seconds while
  visible, and saving still works.

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
ROOM_NOTES_EDIT_GAP_SECONDS=120
ROOM_CLEANUP_INTERVAL_MINUTES=5
ROOM_JOIN_MAX_FAILURES=8
ROOM_JOIN_WINDOW_MINUTES=15
ROOM_SIGNED_URL_SECONDS=120
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

## Known limitations

- Join rate limiting and the cleanup job's "running" guard are per process.
- Notes merging is patch-based (good for normal team typing). Two people editing the exact
  same words at the same moment can produce a mixed result, as in most simple co-editors.
- Each notes save is one HTTP request, so busy typing adds traffic. The app's global
  per-IP rate limit (50,000 requests per 15 minutes) is shared by everyone behind one office IP.
- Room files aren't virus-scanned. Only allow-listed types with matching signatures are accepted.
