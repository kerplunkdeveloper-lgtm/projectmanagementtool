import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiUploadCloud, FiFileText, FiImage, FiFile, FiDownload, FiEye, FiTrash2, FiX, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import { Modal, ConfirmDialog } from "./RoomUI";
import { listFiles, uploadFile, deleteFile, getFileUrl, apiError } from "../../../services/roomService";
import { formatBytes, formatDateTime } from "../roomUtils";

const kindIcon = (kind) => {
  if (kind === "image") return <FiImage className="text-violet-500" aria-hidden="true" />;
  if (kind === "pdf") return <FiFileText className="text-rose-500" aria-hidden="true" />;
  return <FiFile className="text-sky-500" aria-hidden="true" />;
};

let uploadSeq = 0;

const FilesTab = ({ room, refreshKey, onStorageChange, onExpired }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState([]); // {id, name, size, progress, status, error, controller}
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null); // {name, url}
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  const limits = room.limits;
  const canUpload = room.isHost || room.permissions?.membersCanUpload;
  const accept = (limits?.allowedExtensions || []).map((e) => `.${e}`).join(",");

  const handleError = useCallback((err, fallback) => {
    if (err?.response?.status === 410) {
      onExpired?.();
      return;
    }
    toast.error(apiError(err, fallback));
  }, [onExpired]);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      setFiles(await listFiles(room._id));
      setError("");
    } catch (err) {
      if (err?.response?.status === 410) onExpired?.();
      else setError(apiError(err, "Could not load files."));
    } finally {
      if (initial) setLoading(false);
    }
  }, [room._id, onExpired]);

  useEffect(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    if (refreshKey) load(false);
  }, [refreshKey, load]);

  const patchUpload = (id, patch) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const startUploads = async (fileList) => {
    const selected = [...fileList];
    if (!selected.length) return;
    const allowed = new Set(limits?.allowedExtensions || []);
    const queue = selected.map((f) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      let localError = "";
      if (!allowed.has(ext)) localError = `.${ext} files aren't allowed`;
      else if (f.size > limits.maxFileBytes) localError = `Larger than ${formatBytes(limits.maxFileBytes)}`;
      else if (f.size === 0) localError = "File is empty";
      return {
        id: ++uploadSeq,
        file: f,
        name: f.name,
        size: f.size,
        progress: 0,
        status: localError ? "error" : "queued",
        error: localError,
        controller: new AbortController(),
      };
    });
    setUploads((list) => [...queue, ...list]);

    // Sequential uploads keep progress readable and the server quota check accurate.
    for (const item of queue) {
      if (item.status === "error" || item.controller.signal.aborted) continue;
      patchUpload(item.id, { status: "uploading" });
      try {
        const saved = await uploadFile(room._id, item.file, {
          signal: item.controller.signal,
          onProgress: (p) => patchUpload(item.id, { progress: Math.min(p, 99) }),
        });
        patchUpload(item.id, { status: "done", progress: 100 });
        setFiles((list) => [saved, ...list.filter((f) => f._id !== saved._id)]);
        onStorageChange?.();
        setTimeout(() => setUploads((list) => list.filter((u) => u.id !== item.id)), 2500);
      } catch (err) {
        if (err?.code === "ERR_CANCELED") {
          patchUpload(item.id, { status: "canceled", error: "Canceled" });
        } else if (err?.response?.status === 410) {
          onExpired?.();
          return;
        } else {
          patchUpload(item.id, { status: "error", error: apiError(err, "Upload failed") });
        }
      }
    }
  };

  const onPick = (e) => {
    startUploads(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload) return;
    startUploads(e.dataTransfer.files);
  };

  const openPreview = async (f) => {
    if (f.kind === "image") {
      try {
        const url = await getFileUrl(room._id, f._id, "preview");
        setPreview({ name: f.originalName, url });
      } catch (err) {
        handleError(err, "Could not open preview");
      }
      return;
    }
    // PDFs open in a new tab. Open the window synchronously to avoid popup blockers.
    const win = window.open("", "_blank");
    try {
      const url = await getFileUrl(room._id, f._id, "preview");
      if (win) {
        win.opener = null;
        win.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      win?.close();
      handleError(err, "Could not open preview");
    }
  };

  const download = async (f) => {
    try {
      const url = await getFileUrl(room._id, f._id, "download");
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      handleError(err, "Could not download file");
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteFile(room._id, confirmDelete._id);
      setFiles((list) => list.filter((f) => f._id !== confirmDelete._id));
      onStorageChange?.();
      toast.success("File deleted");
      setConfirmDelete(null);
    } catch (err) {
      handleError(err, "Could not delete file");
    } finally {
      setDeleting(false);
    }
  };

  const usedPct = limits ? Math.min(100, Math.round(((room.storage?.bytesUsed || 0) / limits.maxRoomBytes) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {canUpload ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 text-center transition-colors ${
            dragOver
              ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30"
              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          }`}
        >
          <FiUploadCloud className="mx-auto text-indigo-500" size={28} aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Drag files here or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              browse
            </button>
          </p>
          <p id="upload-limits" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Images, PDFs and documents · up to {formatBytes(limits?.maxFileBytes)} each
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={onPick}
            className="sr-only"
            aria-label="Choose files to upload"
            aria-describedby="upload-limits"
            tabIndex={-1}
          />
          <div className="mt-3 max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-label="Room storage used" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full ${usedPct > 85 ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${usedPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {formatBytes(room.storage?.bytesUsed)} of {formatBytes(limits?.maxRoomBytes)} · {room.storage?.fileCount || 0}/{limits?.maxFilesPerRoom} files
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500 dark:text-slate-400">
          The host has turned off uploads for members. You can still view and download files.
        </p>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <ul className="space-y-2" aria-label="Uploads" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.id} className="room-card p-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{u.name}</p>
                    <span className={`text-[11px] font-bold shrink-0 ${u.status === "error" ? "text-rose-600 dark:text-rose-400" : u.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {u.status === "uploading" && `${u.progress}%`}
                      {u.status === "queued" && "Waiting"}
                      {u.status === "done" && "Uploaded"}
                      {(u.status === "error" || u.status === "canceled") && (u.error || "Failed")}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                    role="progressbar"
                    aria-label={`Uploading ${u.name}`}
                    aria-valuenow={u.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full transition-all ${u.status === "error" || u.status === "canceled" ? "bg-rose-400" : u.status === "done" ? "bg-emerald-500" : "bg-indigo-500"}`}
                      style={{ width: `${u.status === "error" ? 100 : u.progress}%` }}
                    />
                  </div>
                </div>
                {u.status === "uploading" || u.status === "queued" ? (
                  <button type="button" className="room-btn-ghost" onClick={() => { u.controller.abort(); patchUpload(u.id, { status: "canceled", error: "Canceled" }); }} aria-label={`Cancel upload of ${u.name}`}>
                    <FiX size={14} />
                  </button>
                ) : u.status !== "done" ? (
                  <button type="button" className="room-btn-ghost" onClick={() => setUploads((l) => l.filter((x) => x.id !== u.id))} aria-label={`Dismiss ${u.name}`}>
                    <FiX size={14} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* File list */}
      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading files">
          {[0, 1, 2].map((i) => (
            <div key={i} className="room-card p-3 animate-pulse flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1">
                <div className="h-3.5 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="room-card p-5 text-center">
          <FiAlertCircle className="mx-auto text-rose-500" size={22} aria-hidden="true" />
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <button type="button" className="room-btn-secondary mt-3" onClick={() => load(true)}>
            <FiRefreshCw size={13} aria-hidden="true" /> Retry
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="room-card p-8 text-center">
          <FiFile className="mx-auto text-slate-300 dark:text-slate-600" size={26} aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No files yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Files shared here are deleted automatically when the room expires.</p>
        </div>
      ) : (
        <div className="room-card overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Files shared in this room</caption>
            <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="text-left font-bold px-4 py-2.5">Name</th>
                <th scope="col" className="text-left font-bold px-3 py-2.5">Size</th>
                <th scope="col" className="text-left font-bold px-3 py-2.5">Uploaded by</th>
                <th scope="col" className="text-left font-bold px-3 py-2.5">Uploaded</th>
                <th scope="col" className="text-right font-bold px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {files.map((f) => (
                <tr key={f._id} className="flex flex-wrap md:table-row items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                  <td className="w-full md:w-auto px-4 pt-3 md:py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">{kindIcon(f.kind)}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[16rem] lg:max-w-[22rem]" title={f.originalName}>{f.originalName}</p>
                        <p className="text-[11px] text-slate-400 uppercase font-bold">{f.extension}</p>
                        <p className="md:hidden text-[11px] text-slate-500 dark:text-slate-400">
                          {formatBytes(f.size)} · {f.uploader?.name || "Unknown"} · {formatDateTime(f.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 text-xs text-slate-600 dark:text-slate-300 tabular-nums">{formatBytes(f.size)}</td>
                  <td className="hidden md:table-cell px-3 py-3 text-xs text-slate-600 dark:text-slate-300">{f.uploader?.name || "Unknown"}</td>
                  <td className="hidden md:table-cell px-3 py-3 text-xs text-slate-600 dark:text-slate-300">{formatDateTime(f.createdAt)}</td>
                  <td className="w-full md:w-auto px-3 pb-3 md:py-3">
                    <div className="flex items-center justify-end gap-1">
                      {f.previewable && (
                        <button type="button" className="room-btn-ghost" onClick={() => openPreview(f)} aria-label={`Preview ${f.originalName}`} title="Preview">
                          <FiEye size={15} />
                        </button>
                      )}
                      <button type="button" className="room-btn-ghost" onClick={() => download(f)} aria-label={`Download ${f.originalName}`} title="Download">
                        <FiDownload size={15} />
                      </button>
                      {f.canDelete && (
                        <button type="button" className="room-btn-ghost hover:!text-rose-600" onClick={() => setConfirmDelete(f)} aria-label={`Delete ${f.originalName}`} title="Delete">
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.name || "Preview"} size="max-w-4xl">
        {preview && (
          <img src={preview.url} alt={preview.name} className="max-h-[75vh] w-auto mx-auto rounded-lg object-contain" referrerPolicy="no-referrer" />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete file?"
        message={`"${confirmDelete?.originalName}" will be permanently deleted for everyone in this room.`}
        confirmLabel="Delete file"
        danger
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default FilesTab;
