import React, { useState, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  FiUploadCloud,
  FiDownload,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiFileText,
  FiTrash2,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGoogle,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import { bulkImportSocialmediaTasks } from "../../features/socialmediaTasks/socialmediaTaskSlice";

const PLATFORM_MAP = {
  instagram: { name: "Instagram", icon: FaInstagram, color: "#E1306C" },
  facebook: { name: "Facebook", icon: FaFacebook, color: "#1877F2" },
  youtube: { name: "YouTube", icon: FaYoutube, color: "#FF0000" },
  gmb: { name: "GMB", icon: FaGoogle, color: "#4285F4" },
  google: { name: "GMB", icon: FaGoogle, color: "#4285F4" },
  twitter: { name: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
  x: { name: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
  linkedin: { name: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
};

// Smart date parser supporting DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serials
export const parseSmartDate = (dateInput, timeInput = "18:00") => {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  if (!str) return null;

  let hours = 18;
  let minutes = 0;
  if (timeInput) {
    const tMatch = String(timeInput).trim().match(/(\d{1,2}):(\d{2})/);
    if (tMatch) {
      hours = parseInt(tMatch[1], 10);
      minutes = parseInt(tMatch[2], 10);
    }
  }

  // Excel serial number (e.g. 45601)
  if (/^\d{5}$/.test(str)) {
    const days = parseInt(str, 10);
    const d = new Date(Math.round((days - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    let day = p1;
    let month = p2 - 1;

    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2 - 1;
    } else if (p2 > 12 && p1 <= 12) {
      day = p2;
      month = p1 - 1;
    } else {
      // Indian standard is DD/MM/YYYY
      day = p1;
      month = p2 - 1;
    }

    return new Date(year, month, day, hours, minutes, 0, 0);
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day, hours, minutes, 0, 0);
  }

  // Word parsed: "5 Nov 2026", "Nov 5, 2026"
  const direct = new Date(str + (timeInput ? " " + timeInput : ""));
  if (!isNaN(direct.getTime())) {
    return direct;
  }

  return null;
};

// Robust RFC-4180 CSV line parser handling quotes & commas within quotes
const parseCSV = (text) => {
  const lines = text.split(/\r\n|\n|\r/);
  const rows = [];

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l].trim();
    if (!line) continue;

    const row = [];
    let insideQuotes = false;
    let entry = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          entry += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        row.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  if (rows.length < 2) return [];

  // Match headers
  const rawHeaders = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const headerMap = {};

  rawHeaders.forEach((h, idx) => {
    if (h.includes("client") || h.includes("company")) headerMap.client = idx;
    else if (h.includes("title") || h.includes("topic") || h.includes("task")) headerMap.taskTitle = idx;
    else if (h.includes("type") || h.includes("format")) headerMap.contentType = idx;
    else if (h.includes("platform") || h.includes("channel")) headerMap.platforms = idx;
    else if (h.includes("publishtime") || h.includes("posttime") || h === "time") headerMap.publishTime = idx;
    else if (h.includes("publish") || h.includes("postdate") || h === "date") headerMap.publishDate = idx;
    else if (h.includes("due") || h.includes("deadline")) headerMap.dueDate = idx;
    else if (h.includes("prior")) headerMap.priority = idx;
    else if (h.includes("status")) headerMap.status = idx;
    else if (h.includes("note") || h.includes("caption") || h.includes("desc")) headerMap.notes = idx;
    else if (h.includes("assign") || h.includes("smm") || h.includes("user") || h.includes("owner")) headerMap.assignee = idx;
  });

  const parsedData = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const clientName = (headerMap.client !== undefined ? row[headerMap.client] : row[0]) || "";
    const taskTitle = (headerMap.taskTitle !== undefined ? row[headerMap.taskTitle] : row[1]) || "";
    const contentType = (headerMap.contentType !== undefined ? row[headerMap.contentType] : row[2]) || "Post";
    const rawPlatforms = (headerMap.platforms !== undefined ? row[headerMap.platforms] : row[3]) || "Instagram";
    const rawPublishDate = (headerMap.publishDate !== undefined ? row[headerMap.publishDate] : row[4]) || "";
    const rawPublishTime = (headerMap.publishTime !== undefined ? row[headerMap.publishTime] : row[5]) || "18:00";
    const rawDueDate = (headerMap.dueDate !== undefined ? row[headerMap.dueDate] : row[6]) || rawPublishDate;
    const priority = (headerMap.priority !== undefined ? row[headerMap.priority] : row[7]) || "Medium";
    const status = (headerMap.status !== undefined ? row[headerMap.status] : row[8]) || "Not started";
    const notes = (headerMap.notes !== undefined ? row[headerMap.notes] : row[9]) || "";
    const assignee = (headerMap.assignee !== undefined ? row[headerMap.assignee] : row[10]) || "";

    // Parse platforms list
    const platforms = rawPlatforms
      .split(/[,;|]/)
      .map((p) => p.trim())
      .filter(Boolean);

    // Smart resolve dates
    const parsedPublish = parseSmartDate(rawPublishDate, rawPublishTime) || parseSmartDate(rawDueDate, "18:00") || new Date();
    const parsedDue = parseSmartDate(rawDueDate, "18:00") || parsedPublish;

    const displayMonthYear = parsedPublish.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

    const displayDateStr = parsedPublish.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " " + String(parsedPublish.getHours()).padStart(2, "0") + ":" + String(parsedPublish.getMinutes()).padStart(2, "0");

    parsedData.push({
      clientName: clientName.trim(),
      taskTitle: taskTitle.trim(),
      category: "Content",
      contentType: contentType.trim() || "Post",
      platforms: platforms.length > 0 ? platforms : ["Instagram"],
      publishDate: parsedPublish.toISOString(),
      displayDateStr,
      displayMonthYear,
      targetMonth: parsedPublish.getMonth(),
      targetYear: parsedPublish.getFullYear(),
      dueDate: parsedDue.toISOString(),
      priority: priority.trim() || "Medium",
      status: status.trim() || "Not started",
      notes: notes.trim(),
      assigneeName: assignee.trim(),
    });
  }

  return parsedData;
};

export default function SmImportExcelModal({
  isOpen,
  onClose,
  clients = [],
  users = [],
  onSuccess,
}) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fast client map for instant lookup
  const clientsMap = useMemo(() => {
    const map = new Map();
    clients.forEach((c) => {
      if (c.companyName) {
        map.set(c.companyName.trim().toLowerCase(), c);
      }
    });
    return map;
  }, [clients]);

  if (!isOpen) return null;

  // Generate and download template with UTF-8 BOM
  const handleDownloadTemplate = () => {
    const sampleClient1 = clients[0]?.companyName || "Anandhavilas";
    const sampleClient2 = clients[1]?.companyName || (clients[0]?.companyName || "Vasanth & Co");
    const sampleUser = users[0]?.name || "Eshwar";

    const headers = [
      "Client Name",
      "Task Title",
      "Content Type",
      "Platforms",
      "Publish Date",
      "Publish Time",
      "Due Date",
      "Priority",
      "Status",
      "Notes / Caption",
      "Assignee",
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const sampleRows = [
      [
        `"${sampleClient1}"`,
        `"Deepavali Sweet Box Special Post"`,
        `"Post"`,
        `"Instagram, Facebook, LinkedIn"`,
        `"${todayStr}"`,
        `"18:00"`,
        `"${todayStr}"`,
        `"High"`,
        `"Not started"`,
        `"Special celebration post with pricing caption"`,
        `"${sampleUser}"`,
      ],
      [
        `"${sampleClient1}"`,
        `"Behind The Scenes Reel"`,
        `"Reels"`,
        `"Instagram, YouTube"`,
        `"${tomorrowStr}"`,
        `"19:30"`,
        `"${todayStr}"`,
        `"Medium"`,
        `"In progress"`,
        `"Short video with trending audio"`,
        `"${sampleUser}"`,
      ],
      [
        `"${sampleClient2}"`,
        `"Customer Review & Testimonial Story"`,
        `"Stories"`,
        `"Instagram, Facebook"`,
        `"${tomorrowStr}"`,
        `"12:00"`,
        `"${tomorrowStr}"`,
        `"Low"`,
        `"Not started"`,
        `"5-star feedback screenshot with thank you sticker"`,
        `"${sampleUser}"`,
      ],
    ];

    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\n" +
      sampleRows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Content_Calendar_Commitment_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Sample template downloaded!");
  };

  const processFile = (uploadedFile) => {
    if (!uploadedFile) return;
    const name = uploadedFile.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
      toast.error("Please upload a CSV file (.csv). You can save Excel sheets as CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          toast.error("No valid data rows found in the file. Please check template format.");
          return;
        }
        setFile(uploadedFile);
        setParsedRows(rows);
        toast.success(`Loaded ${rows.length} commitment rows ready to preview!`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      toast.error("No rows to import");
      return;
    }

    const validRows = parsedRows.filter((r) => r.taskTitle && r.clientName);
    if (validRows.length === 0) {
      toast.error("None of the rows have valid Task Title and Client Name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(bulkImportSocialmediaTasks(validRows));
      if (bulkImportSocialmediaTasks.fulfilled.match(resultAction)) {
        const targetMonth = validRows[0]?.targetMonth;
        const targetYear = validRows[0]?.targetYear;

        handleClear();
        if (onSuccess) onSuccess({ targetMonth, targetYear });
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1e2a40] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1e2a40] bg-slate-50/70 dark:bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FiUploadCloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Import Commitment Tasks (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your commitment post schedule. All posts will appear dynamically on the Content Calendar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Download Template Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500 text-white shrink-0 mt-0.5">
                <FiDownload size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Step 1: Download Standard Excel / CSV Template
                </h3>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Pre-configured headers with sample commitment rows. Supports formats like <strong>YYYY-MM-DD</strong> or <strong>DD/MM/YYYY</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer shrink-0 self-start sm:self-center"
            >
              <FiDownload size={14} />
              <span>Download Template (.csv)</span>
            </button>
          </div>

          {/* Step 2: Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Step 2: Upload Completed CSV / Excel File
              </label>
              {file && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  <FiTrash2 size={12} />
                  <span>Remove file</span>
                </button>
              )}
            </div>

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 bg-slate-50/40 dark:bg-[#0a0f1d]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, text/csv, .txt"
                  className="hidden"
                  onChange={(e) => processFile(e.target.files?.[0])}
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <FiUploadCloud size={24} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Click to browse or drag and drop your CSV file here
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Supports .csv exported from Microsoft Excel, Google Sheets, or Apple Numbers
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/80 dark:bg-[#131d31] border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <FiFileText size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows loaded
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <FiCheck size={11} /> Ready to preview
                </span>
              </div>
            )}
          </div>

          {/* Step 3: Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiLayers className="text-indigo-500" size={14} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Preview & Validation ({parsedRows.length} commitment posts)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Scheduled Month: <span className="font-bold text-emerald-600 dark:text-emerald-400">{parsedRows[0]?.displayMonthYear}</span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1e2a40] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100/90 dark:bg-[#152033] text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-[#1e2a40]">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Task Title</th>
                      <th className="py-2.5 px-3">Format</th>
                      <th className="py-2.5 px-3">Platforms</th>
                      <th className="py-2.5 px-3">Publish Date & Time</th>
                      <th className="py-2.5 px-3">Assignee</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0c1220]">
                    {parsedRows.map((row, idx) => {
                      const matchedClient = clientsMap.get(row.clientName?.toLowerCase());
                      const clientColor = matchedClient?.color || "#6366f1";
                      const isValid = Boolean(row.taskTitle && row.clientName);

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 dark:hover:bg-[#121c30] transition-colors ${
                            !isValid ? "bg-rose-50/30 dark:bg-rose-950/20" : ""
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border truncate max-w-[130px]"
                              style={{
                                color: clientColor,
                                borderColor: `${clientColor}40`,
                                backgroundColor: `${clientColor}12`,
                              }}
                              title={row.clientName}
                            >
                              {row.clientName || "Missing Client"}
                            </span>
                            {!matchedClient && row.clientName && (
                              <span className="block text-[9px] text-amber-500 font-medium">
                                (New client)
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]" title={row.taskTitle}>
                            {row.taskTitle || (
                              <span className="text-rose-500 italic">Title missing</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {row.contentType}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {row.platforms.map((p, pIdx) => {
                                const platInfo = PLATFORM_MAP[p.toLowerCase()];
                                const IconComponent = platInfo?.icon || FaInstagram;
                                return (
                                  <span
                                    key={pIdx}
                                    className="p-1 rounded bg-slate-100 dark:bg-[#131d31] text-slate-600 dark:text-slate-300"
                                    title={p}
                                  >
                                    <IconComponent size={11} style={{ color: platInfo?.color }} />
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-semibold">
                            {row.displayDateStr}
                          </td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                            {row.assigneeName || "Unassigned"}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#131d31] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isValid ? (
                              <span className="inline-flex text-emerald-500" title="Valid">
                                <FiCheckCircle size={14} />
                              </span>
                            ) : (
                              <span className="inline-flex text-rose-500" title="Missing Title or Client">
                                <FiAlertTriangle size={14} />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-[#1e2a40] bg-slate-50/70 dark:bg-[#0f172a]">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedRows.length > 0 ? (
              <span>
                <strong className="text-slate-900 dark:text-white">{parsedRows.length}</strong> tasks ready to import
              </span>
            ) : (
              <span>Download template or upload your CSV file to get started</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1e2a40] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#182338] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={parsedRows.length === 0 || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Importing...</span>
              ) : (
                <>
                  <FiCheck size={14} />
                  <span>Import {parsedRows.length > 0 ? `(${parsedRows.length})` : ""} Posts</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
