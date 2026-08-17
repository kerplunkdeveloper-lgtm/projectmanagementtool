import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getClients } from "../../features/clients/clientslice";
import {
  useGetContentCalendarSummaryQuery,
  useGetContentCalendarPostsQuery,
  useCreateContentCalendarPostMutation,
  useBulkCreateContentCalendarPostsMutation,
  useUpdateContentCalendarPostMutation,
  useDeleteContentCalendarPostMutation,
  useClearClientCalendarMutation,
} from "../../features/api/apiSlice";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addDays,
} from "date-fns";
import {
  FiCalendar,
  FiPlus,
  FiUpload,
  FiDownload,
  FiTrash2,
  FiEdit3,
  FiImage,
  FiVideo,
  FiInstagram,
  FiFacebook,
  FiLinkedin,
  FiTwitter,
  FiYoutube,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiFileText,
  FiLayers,
  FiShare2,
  FiExternalLink,
  FiFilter,
  FiCopy,
  FiTag,
  FiCheck,
  FiRefreshCw,
  FiInfo,
  FiBriefcase,
  FiTrendingUp,
  FiTarget,
  FiCamera,
  FiGlobe,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
  FaPinterestP,
  FaTiktok,
} from "react-icons/fa";

const CATEGORIES = ["Post", "Reel", "Story"];

const ACCENT_HEX_MAP = {
  default: "#3b82f6",
  emerald: "#10b981",
  violet: "#7c3aed",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  lime: "#84cc16",
  fuchsia: "#d946ef",
  teal: "#0d9488",
  red: "#dc2626",
  indigo: "#4f46e5",
  gold: "#b45309",
  mauve: "#582c4d",
  lavender: "#8b5cf6",
};

const ContentCalcendor = () => {
  const dispatch = useDispatch();
  const { theme, accentColor } = useTheme();
  const activeAccentHex =
    accentColor && accentColor.startsWith("#")
      ? accentColor
      : ACCENT_HEX_MAP[accentColor] || "#3b82f6";

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const { user } = useSelector((state) => state.auth);
  const { clients } = useSelector((state) => state.clients);

  useEffect(() => {
    dispatch(getClients());
  }, [dispatch]);

  // Selected Client State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Auto select first client if available
  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0]._id);
    }
  }, [clients, selectedClientId]);

  const selectedClient = useMemo(() => {
    return (clients || []).find((c) => c._id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Fetch summary counts per client for tabs
  const { data: clientsSummary = [] } = useGetContentCalendarSummaryQuery();

  const summaryMap = useMemo(() => {
    const map = {};
    (clientsSummary || []).forEach((item) => {
      if (item._id) {
        map[item._id] = item.totalPosts || 0;
      }
    });
    return map;
  }, [clientsSummary]);

  // Calendar Date State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch Posts for Selected Client
  const {
    data: calendarPosts = [],
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useGetContentCalendarPostsQuery(
    selectedClientId ? { client: selectedClientId } : {},
    { skip: !selectedClientId },
  );

  // Mutations
  const [createPost] = useCreateContentCalendarPostMutation();
  const [bulkCreatePosts] = useBulkCreateContentCalendarPostsMutation();
  const [updatePost] = useUpdateContentCalendarPostMutation();
  const [deletePost] = useDeleteContentCalendarPostMutation();
  const [clearClientCalendar, { isLoading: isClearing }] =
    useClearClientCalendarMutation();

  // Image Management & Queue State (Step 1, Step 2, Step 3)
  const [queueFiles, setQueueFiles] = useState([]);
  const [uploadedFileNames, setUploadedFileNames] = useState("");
  const [isPickingStartDate, setIsPickingStartDate] = useState(false);

  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const clientDropdownRef = useRef(null);
  const topClientDropdownRef = useRef(null);

  // Top Client Dropdown State
  const [showTopClientDropdown, setShowTopClientDropdown] = useState(false);
  const [topClientSearch, setTopClientSearch] = useState("");

  // Clear Confirmation Modal State
  const [showClearModal, setShowClearModal] = useState(false);

  // Delete Post Confirmation Modal State
  const [deletePostModal, setDeletePostModal] = useState({
    open: false,
    postId: null,
    title: "",
  });

  // Drag and Drop Visual Feedback & Speed Optimization States
  const [draggingPostId, setDraggingPostId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  // PDF Month Selection Modal State (Matching User Reference Image)
  const [pdfModal, setPdfModal] = useState({ open: false, type: "visual" });
  const [selectedPdfMonths, setSelectedPdfMonths] = useState([]);

  // Available Months for PDF Generation
  const availableMonths = useMemo(() => {
    const base = new Date();
    const list = [];
    for (let i = -2; i <= 6; i++) {
      const d = addMonths(base, i);
      list.push({
        key: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy"),
        date: d,
      });
    }
    return list;
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(e.target)
      ) {
        setShowClientDropdown(false);
      }
      if (
        topClientDropdownRef.current &&
        !topClientDropdownRef.current.contains(e.target)
      ) {
        setShowTopClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Group posts by date string (YYYY-MM-DD)
  const postsByDate = useMemo(() => {
    const map = {};
    calendarPosts.forEach((post) => {
      if (post.scheduledDate) {
        const dStr = format(parseISO(post.scheduledDate), "yyyy-MM-dd");
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(post);
      }
    });
    return map;
  }, [calendarPosts]);

  // Scheduled Deliverables Counts for current month/calendar
  const scheduledCounts = useMemo(() => {
    let postsCount = 0;
    let reelsCount = 0;
    let storiesCount = 0;
    let otherCount = 0;

    (calendarPosts || []).forEach((p) => {
      const cat = (p.category || "").toLowerCase();
      if (cat.includes("reel")) {
        reelsCount++;
      } else if (cat.includes("story")) {
        storiesCount++;
      } else if (
        cat.includes("post") ||
        cat.includes("static") ||
        cat.includes("carousel") ||
        cat.includes("festival") ||
        cat.includes("offer")
      ) {
        postsCount++;
      } else {
        otherCount++;
      }
    });

    return {
      posts: postsCount,
      reels: reelsCount,
      stories: storiesCount,
      other: otherCount,
      total: (calendarPosts || []).length,
    };
  }, [calendarPosts]);

  // Helper: File to Compressed Base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const maxWidth = 1200;
            const maxHeight = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG 85%
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            resolve(compressed);
          };
          img.onerror = () => resolve(event.target.result);
        };
        reader.onerror = (error) => reject(error);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      }
    });

  // Step 1: Handle Files Selected
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadedFileNames(files.map((f) => f.name).join(", "));

    const newItems = files.map((file, idx) => {
      const isVid = file.type.startsWith("video");
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");
      return {
        id: `queue-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title: cleanTitle || "Social media",
        category: isVid ? "Reel" : "Post",
        link: "",
        content: "",
      };
    });

    setQueueFiles((prev) => [...prev, ...newItems]);
    toast.success(`${files.length} file(s) added to queue`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Step 2: Update item in Queue
  const updateQueueItem = (id, field, value) => {
    setQueueFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeQueueItem = (id) => {
    setQueueFiles((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  // Step 3: Toggle Picking Mode (Image 2 -> Image 3)
  const handleTogglePickingMode = () => {
    if (queueFiles.length === 0) {
      toast.error("Please upload images first in Step 1");
      return;
    }
    if (isPickingStartDate) {
      setIsPickingStartDate(false);
    } else {
      setIsPickingStartDate(true);
      toast(
        "Click a start date in the calendar below to place your queued posts!",
        {
          icon: "📅",
        },
      );
    }
  };

  // Handle Date Cell Click (When picking start date or adding direct post)
  const handleDateCellClick = async (dateObj) => {
    if (!selectedClientId) {
      toast.error("Please select a Client first");
      return;
    }

    const dStr = format(dateObj, "yyyy-MM-dd");

    // If in Picking Start Date mode: Distribute all queued items starting from this date
    if (isPickingStartDate) {
      if (queueFiles.length === 0) {
        setIsPickingStartDate(false);
        return;
      }

      const toastId = toast.loading("Importing queued posts to calendar...");
      try {
        const postsToSubmit = [];
        for (let i = 0; i < queueFiles.length; i++) {
          const item = queueFiles[i];
          const postDate = addDays(dateObj, i);
          let mediaArr = [];

          if (item.file) {
            try {
              const b64 = await fileToBase64(item.file);
              mediaArr.push({
                url: b64,
                mediaType: item.file.type.startsWith("video")
                  ? "video"
                  : "image",
                filename: item.file.name,
                size: item.file.size,
              });
            } catch (e) {
              console.error("Base64 error:", e);
            }
          }

          postsToSubmit.push({
            title: item.title || `Post ${i + 1}`,
            content: item.content || "",
            link: item.link || "",
            scheduledDate: format(postDate, "yyyy-MM-dd"),
            time: "10:00 AM",
            category: item.category || "Post",
            platform: ["Instagram"],
            status: "Planned",
            media: mediaArr,
          });
        }

        await bulkCreatePosts({
          client: selectedClientId,
          posts: postsToSubmit,
        }).unwrap();

        // Clean previews
        queueFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setQueueFiles([]);
        setUploadedFileNames("");
        setIsPickingStartDate(false);
        toast.success(
          `Successfully placed ${postsToSubmit.length} post(s) starting from ${format(dateObj, "dd MMM yyyy")}!`,
          { id: toastId },
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to import queued posts", { id: toastId });
      }
    }
  };

  // Add Direct Blank Post to Date via `+` button in cell
  const handleAddDirectPost = async (dateObj, e) => {
    if (e) e.stopPropagation();
    if (!selectedClientId) {
      toast.error("Please select a Client first");
      return;
    }
    const dStr = format(dateObj, "yyyy-MM-dd");
    try {
      await createPost({
        client: selectedClientId,
        title: "New Creative Post",
        content: "",
        link: "",
        scheduledDate: dStr,
        time: "10:00 AM",
        category: "Post",
        platform: ["Instagram"],
        status: "Planned",
        media: [],
      }).unwrap();
      toast.success(`Post added to ${format(dateObj, "dd MMM")}`);
    } catch (err) {
      toast.error("Failed to add post");
    }
  };

  // In-place update for calendar post
  const handleUpdatePostField = async (postId, field, value) => {
    try {
      await updatePost({
        id: postId,
        postData: { [field]: value },
      }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Calendar Post with Confirmation Prompt
  const handlePromptDeletePost = (post, e) => {
    if (e) e.stopPropagation();
    setDeletePostModal({
      open: true,
      postId: post._id,
      title: post.title || "Untitled Post",
    });
  };

  // Execute Confirmed Delete
  const handleConfirmDeletePost = async () => {
    if (!deletePostModal.postId) return;
    try {
      await deletePost(deletePostModal.postId).unwrap();
      toast.success("Post removed from calendar");
      setDeletePostModal({ open: false, postId: null, title: "" });
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  // Drag and Drop handlers between calendar dates with instant visual feedback
  const handleDragStart = (e, postId) => {
    e.dataTransfer.setData("text/plain", postId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingPostId(postId);
  };

  const handleDragEnd = () => {
    setDraggingPostId(null);
    setDragOverDate(null);
  };

  const handleDropPostOnDate = async (targetDateStr, e) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("text/plain") || draggingPostId;
    setDragOverDate(null);
    setDraggingPostId(null);

    if (!postId) return;

    try {
      await updatePost({
        id: postId,
        postData: { scheduledDate: targetDateStr },
      }).unwrap();
      toast.success(
        `Post moved to ${format(parseISO(targetDateStr), "dd MMM yyyy")}`,
        { duration: 1500 }
      );
    } catch (err) {
      toast.error("Failed to reschedule post");
    }
  };

  // Clear Client Calendar
  const handleClearAllCalendar = async () => {
    if (!selectedClientId) return;
    try {
      await clearClientCalendar({ clientId: selectedClientId }).unwrap();
      toast.success("Client calendar cleared!");
      setShowClearModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to clear calendar");
    }
  };

  // Export for Google Calendar (.ics)
  const handleExportICS = () => {
    if (calendarPosts.length === 0) {
      toast.error("No posts found to export");
      return;
    }

    const clientName = selectedClient?.companyName || "Client";
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kerplunk Media//Content Calendar//EN",
      `X-WR-CALNAME:${clientName} Content Calendar`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    calendarPosts.forEach((post) => {
      const d = post.scheduledDate ? new Date(post.scheduledDate) : new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dtStart = `${yyyy}${mm}${dd}T090000`;
      const dtEnd = `${yyyy}${mm}${dd}T100000`;

      const summary = `[${post.category || "Post"}] ${post.title} (${(post.platform || []).join(", ")})`;
      const desc = `Client: ${clientName}\\nCategory: ${post.category || ""}\\nLink: ${post.link || ""}\\nStatus: ${post.status || ""}\\n\\nCaption:\\n${(post.content || "").replace(/\n/g, "\\n")}`;

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:post-${post._id || Math.random()}@kerplunkmedia.com`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary.replace(/,/g, "\\,")}`,
        `DESCRIPTION:${desc}`,
        `STATUS:${post.status === "Published" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT",
      );
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${clientName.replace(/\s+/g, "_")}_Content_Calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Google Calendar (.ics) file exported successfully!");
  };

  // Download JSON
  const handleDownloadJSON = () => {
    if (calendarPosts.length === 0) {
      toast.error("No posts to export");
      return;
    }
    const clientName = selectedClient?.companyName || "Client";
    const exportData = {
      client: {
        id: selectedClient?._id,
        name: clientName,
        industry: selectedClient?.industry,
      },
      exportedAt: new Date().toISOString(),
      posts: calendarPosts.map((p) => ({
        title: p.title,
        content: p.content,
        link: p.link,
        scheduledDate: p.scheduledDate
          ? format(parseISO(p.scheduledDate), "yyyy-MM-dd")
          : "",
        time: p.time,
        category: p.category,
        platform: p.platform,
        status: p.status,
        media: p.media,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${clientName.replace(/\s+/g, "_")}_Content_Calendar.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON backup downloaded!");
  };

  // Upload JSON & Import
  const handleUploadJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClientId) {
      toast.error("Please select a Client first");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        const postsList = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.posts)
            ? parsed.posts
            : null;

        if (!postsList || postsList.length === 0) {
          toast.error("Invalid JSON format or no posts found in file");
          return;
        }

        const toastId = toast.loading(
          `Importing ${postsList.length} posts from JSON...`,
        );
        await bulkCreatePosts({
          client: selectedClientId,
          posts: postsList,
        }).unwrap();

        toast.success(`Successfully imported ${postsList.length} posts!`, {
          id: toastId,
        });
      } catch (err) {
        toast.error("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = "";
  };

  // Printable PDF Generators (Visual, Table, Combined)
  const printDocument = (htmlContent, title) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download/print the PDF");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            body { padding: 24px; color: #1e293b; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
            .header p { font-size: 13px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 10px; }
            tr:nth-child(even) { background: #f8fafc; }
            
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-top: 16px; }
            .day-cell { border: 1px solid #e2e8f0; border-radius: 8px; min-height: 120px; padding: 6px; background: #fff; }
            .day-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
            .post-card { background: #f1f5f9; border-left: 3px solid #3b82f6; padding: 5px; border-radius: 4px; margin-bottom: 5px; font-size: 10px; }
            .post-thumb { width: 100%; height: 50px; object-fit: cover; border-radius: 3px; margin-bottom: 4px; }
            
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 12mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Open Month Selection Modal for Visual or Combined PDF
  const handleOpenPdfModal = (type) => {
    setSelectedPdfMonths([format(currentMonth, "yyyy-MM")]);
    setPdfModal({ open: true, type });
  };

  // Toggle Month Checkbox Selection
  const handleTogglePdfMonth = (monthKey) => {
    if (selectedPdfMonths.includes(monthKey)) {
      if (selectedPdfMonths.length === 1) {
        toast.error("Please select at least one month");
        return;
      }
      setSelectedPdfMonths(selectedPdfMonths.filter((m) => m !== monthKey));
    } else {
      setSelectedPdfMonths([...selectedPdfMonths, monthKey]);
    }
  };

  // Generate Multi-Month PDF (Visual or Combined)
  const handleGeneratePdf = () => {
    if (selectedPdfMonths.length === 0) {
      toast.error("Please select at least one month");
      return;
    }

    const clientName = selectedClient?.companyName || "Client";
    const sortedMonths = [...selectedPdfMonths].sort();
    const type = pdfModal.type;

    let fullPagesHtml = "";

    sortedMonths.forEach((mKey, pageIdx) => {
      const monthDate = parseISO(`${mKey}-01`);
      const monthName = format(monthDate, "MMMM yyyy");

      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(mStart);
      const sDate = startOfWeek(mStart);
      const eDate = endOfWeek(mEnd);
      const days = eachDayOfInterval({ start: sDate, end: eDate });

      const daysHtml = days
        .map((day) => {
          const dStr = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate[dStr] || [];
          const isCurrM = isSameMonth(day, monthDate);

          const postsMarkup = dayPosts
            .map((p) => {
              const img =
                p.media && p.media.length > 0
                  ? `<img class="post-thumb" src="${p.media[0].url}" alt="" />`
                  : "";
              return `
              <div class="post-card">
                ${img}
                <div style="font-weight:700; color:#1e293b; margin-bottom:2px;">${p.title}</div>
                <div style="font-size:9px; color:#475569;">${p.category || "Post"}</div>
                ${p.link ? `<div style="font-size:8px; color:#3b82f6;">${p.link}</div>` : ""}
              </div>
            `;
            })
            .join("");

          return `
            <div class="day-cell" style="opacity: ${isCurrM ? "1" : "0.35"}; min-height: 100px;">
              <div class="day-header">
                <span>${format(day, "d")}</span>
                <span>${format(day, "EEE")}</span>
              </div>
              ${postsMarkup}
            </div>
          `;
        })
        .join("");

      const pageBreak =
        pageIdx > 0 ? `<div style="page-break-before: always;"></div>` : "";

      fullPagesHtml += `
        ${pageBreak}
        <div class="header">
          <div>
            <h1>${clientName} — Content Calendar (Visual)</h1>
            <p>Month: <strong>${monthName}</strong> | Total Scheduled Posts: <strong>${calendarPosts.length}</strong></p>
          </div>
          <div style="text-align: right;">
            <div class="badge" style="background:#3b82f6; color:#fff;">Page ${pageIdx + 1} of ${sortedMonths.length}</div>
            <p style="font-size:10px; color:#94a3b8; margin-top:4px;">Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
          </div>
        </div>
        <div class="calendar-grid">
          ${daysHtml}
        </div>
      `;
    });

    // If Combined, append the detailed Table Matrix
    if (type === "combined") {
      const rowsHtml = calendarPosts
        .map((p, idx) => {
          const dStr = p.scheduledDate
            ? format(parseISO(p.scheduledDate), "dd MMM yyyy")
            : "-";
          return `
          <tr>
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${dStr}</strong></td>
            <td>${p.category || "Post"}</td>
            <td><strong>${p.title}</strong></td>
            <td>${p.link || "—"}</td>
            <td style="max-width:260px; white-space:pre-wrap;">${p.content || "—"}</td>
          </tr>
        `;
        })
        .join("");

      fullPagesHtml += `
        <div style="page-break-before: always;"></div>
        <div class="header">
          <div>
            <h1>${clientName} — Detailed Content Plan Matrix</h1>
            <p>Total Scheduled Posts: <strong>${calendarPosts.length}</strong></p>
          </div>
          <div style="text-align: right;">
            <div class="badge" style="background:#10b981; color:#fff;">Table View</div>
            <p style="font-size:10px; color:#94a3b8; margin-top:4px;">Generated: ${format(new Date(), "dd MMM yyyy")}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th style="width:95px;">Date</th>
              <th style="width:85px;">Type</th>
              <th style="width:160px;">Title</th>
              <th style="width:140px;">Link</th>
              <th>Caption</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    }

    setPdfModal({ open: false, type: "visual" });
    printDocument(
      fullPagesHtml,
      `${clientName}_${type === "combined" ? "Combined" : "Visual"}_Calendar`
    );
  };

  // 1. Download Visual PDF
  const handleDownloadVisualPDF = () => {
    handleOpenPdfModal("visual");
  };

  // 2. Download Table PDF
  const handleDownloadTablePDF = () => {
    const clientName = selectedClient?.companyName || "Client";
    const monthName = format(currentMonth, "MMMM yyyy");

    const rowsHtml = calendarPosts
      .map((p, idx) => {
        const dStr = p.scheduledDate
          ? format(parseISO(p.scheduledDate), "dd MMM yyyy")
          : "-";
        return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${dStr}</strong></td>
          <td><span class="badge" style="background:#e0e7ff; color:#3730a3;">${p.category || "Post"}</span></td>
          <td><strong>${p.title}</strong></td>
          <td>${p.link || "—"}</td>
          <td style="max-width:280px; white-space:pre-wrap;">${p.content || "—"}</td>
        </tr>
      `;
      })
      .join("");

    const content = `
      <div class="header">
        <div>
          <h1>${clientName} — Content Calendar Plan (Table)</h1>
          <p>Month: <strong>${monthName}</strong> | Total Posts: <strong>${calendarPosts.length}</strong></p>
        </div>
        <div style="text-align: right;">
          <div class="badge" style="background:#10b981; color:#fff;">Table View</div>
          <p style="font-size:10px; color:#94a3b8; margin-top:4px;">Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th style="width:110px;">Date</th>
            <th style="width:90px;">Category</th>
            <th style="width:180px;">Title</th>
            <th style="width:160px;">Link</th>
            <th>Caption / Description</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" style="text-align:center; padding:20px;">No posts scheduled for this period.</td></tr>`}
        </tbody>
      </table>
    `;

    printDocument(content, `${clientName}_Table_Calendar_${monthName}`);
  };

  // 3. Download Combined PDF
  const handleDownloadCombinedPDF = () => {
    handleOpenPdfModal("combined");
  };

  return (
    <div className="w-full min-h-screen pb-16 space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        multiple
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleUploadJSON}
        accept=".json,application/json"
        className="hidden"
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 0: CLIENT SELECTOR (Button Dropdown)
      ───────────────────────────────────────────────────────────── */}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: CLIENT DELIVERABLES & QUOTA TRACKER
      ───────────────────────────────────────────────────────────── */}
      {selectedClient && (
        <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl text-white shadow-xs flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeAccentHex }}
              >
                <FiTarget size={17} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>{selectedClient.companyName}</span>
                  <span className="text-xs font-bold text-slate-400">
                    — Monthly Deliverables Target
                  </span>
                </h3>
              </div>
            </div>

            {/* client dropdown */}

            {/* Client Dropdown Button */}
            <div
              className="relative min-w-[260px] sm:min-w-[340px]"
              ref={topClientDropdownRef}
            >
              <button
                type="button"
                onClick={() => setShowTopClientDropdown(!showTopClientDropdown)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs text-left"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/40"
                    style={{
                      backgroundColor: selectedClient?.color || "#3b82f6",
                    }}
                  />
                  <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                    {selectedClient?.companyName || "Select a client"}
                  </span>

                  {/* Target tag */}
                  {(selectedClient?.posts > 0 ||
                    selectedClient?.reels > 0 ||
                    selectedClient?.story > 0) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 shrink-0">
                      {[
                        selectedClient.posts > 0
                          ? `${selectedClient.posts}P`
                          : null,
                        selectedClient.reels > 0
                          ? `${selectedClient.reels}R`
                          : null,
                        selectedClient.story > 0
                          ? `${selectedClient.story}S`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <FiChevronRight
                    className={`text-slate-400 transition-transform duration-200 ${
                      showTopClientDropdown ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showTopClientDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <FiSearch className="text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search client..."
                        value={topClientSearch}
                        onChange={(e) => setTopClientSearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                    {(clients || [])
                      .filter((c) =>
                        c.companyName
                          ?.toLowerCase()
                          .includes(topClientSearch.toLowerCase()),
                      )
                      .map((c) => {
                        const isSelected = selectedClientId === c._id;

                        return (
                          <div
                            key={c._id}
                            onClick={() => {
                              setSelectedClientId(c._id);
                              setShowTopClientDropdown(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: c.color || "#3b82f6",
                                }}
                              />
                              <span className="truncate">{c.companyName}</span>
                              {(c.posts > 0 || c.reels > 0 || c.story > 0) && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {[
                                    c.posts > 0 ? `${c.posts}P` : null,
                                    c.reels > 0 ? `${c.reels}R` : null,
                                    c.story > 0 ? `${c.story}S` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" - ")}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected && (
                                <FiCheck
                                  size={14}
                                  className="text-indigo-600"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deliverables Metric Grid (Posts, Reels, Stories Target Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Posts Deliverable */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                    <FiLayers size={14} />
                  </div>
                  <span>Posts Target</span>
                </div>
                <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                  {selectedClient.posts || 0} Posts
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>
                    Scheduled:{" "}
                    <strong className="text-blue-700 dark:text-blue-300 font-bold">
                      {scheduledCounts.posts}
                    </strong>
                  </span>
                  <span>
                    {selectedClient.posts > 0
                      ? `${Math.round((scheduledCounts.posts / selectedClient.posts) * 100)}%`
                      : "—"}
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-200/60 dark:bg-blue-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        selectedClient.posts > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (scheduledCounts.posts / selectedClient.posts) *
                                  100,
                              ),
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Reels Deliverable */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300">
                    <FiVideo size={14} />
                  </div>
                  <span>Reels Target</span>
                </div>
                <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                  {selectedClient.reels || 0} Reels
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>
                    Scheduled:{" "}
                    <strong className="text-purple-700 dark:text-purple-300 font-bold">
                      {scheduledCounts.reels}
                    </strong>
                  </span>
                  <span>
                    {selectedClient.reels > 0
                      ? `${Math.round((scheduledCounts.reels / selectedClient.reels) * 100)}%`
                      : "—"}
                  </span>
                </div>
                <div className="w-full h-2 bg-purple-200/60 dark:bg-purple-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        selectedClient.reels > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (scheduledCounts.reels / selectedClient.reels) *
                                  100,
                              ),
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Stories Deliverable */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                    <FaInstagram size={14} />
                  </div>
                  <span>Stories Target</span>
                </div>
                <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                  {selectedClient.story || 0} Stories
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>
                    Scheduled:{" "}
                    <strong className="text-rose-700 dark:text-rose-300 font-bold">
                      {scheduledCounts.stories}
                    </strong>
                  </span>
                  <span>
                    {selectedClient.story > 0
                      ? `${Math.round((scheduledCounts.stories / selectedClient.story) * 100)}%`
                      : "—"}
                  </span>
                </div>
                <div className="w-full h-2 bg-rose-200/60 dark:bg-rose-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        selectedClient.story > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (scheduledCounts.stories /
                                  selectedClient.story) *
                                  100,
                              ),
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: IMAGE MANAGEMENT (Matching User Reference Images 1, 2, 3)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
          Image Management
        </h2>

        {/* Step 1: Upload Files */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Step 1: Upload Files
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Choose Files
            </button>
            <span className="text-xs text-slate-500 font-medium truncate max-w-md">
              {uploadedFileNames || "No file chosen"}
            </span>
          </div>
        </div>

        {/* Step 2: Categorize & Queue (Matching Reference Image 1) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Step 2: Categorize & Queue
          </label>
          <div className="w-full min-h-[140px] p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            {queueFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <FiUpload size={28} className="mb-2 opacity-50" />
                <p className="text-xs font-medium">
                  Upload images or creatives above to categorize and prepare
                  them for calendar import.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-4 flex-wrap">
                {queueFiles.map((item) => (
                  <div
                    key={item.id}
                    className="w-[125px] p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs space-y-2 relative group shrink-0"
                  >
                    {/* Dark Circular Delete X Button on Top Right (Matching Image 1) */}
                    <button
                      type="button"
                      onClick={() => removeQueueItem(item.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-900 text-white flex items-center justify-center text-[10px] shadow-sm z-10 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <FiX size={11} />
                    </button>

                    {/* Image Thumbnail */}
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Category Select Dropdown (Post, Reel, Story, etc.) */}
                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateQueueItem(item.id, "category", e.target.value)
                      }
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {/* Bottom Row: Editable Title + Refresh/Sync Icon (Matching Image 1) */}
                    <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-700/60">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateQueueItem(item.id, "title", e.target.value)
                        }
                        placeholder="Title..."
                        className="w-full text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Quick cycle category
                          const curIdx = CATEGORIES.indexOf(item.category);
                          const nextCat =
                            CATEGORIES[(curIdx + 1) % CATEGORIES.length];
                          updateQueueItem(item.id, "category", nextCat);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                        title="Change type"
                      >
                        <FiRefreshCw size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Bulk Import (Matching Reference Images 2 & 3) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Step 3: Bulk Import (Optional)
          </label>
          <button
            type="button"
            onClick={handleTogglePickingMode}
            style={
              isPickingStartDate
                ? { backgroundColor: "#eab308" } // Golden Yellow (Image 3)
                : { backgroundColor: activeAccentHex } // Purple/Theme (Image 2)
            }
            className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
              isPickingStartDate ? "ring-2 ring-yellow-400/50" : ""
            }`}
          >
            <span>
              {isPickingStartDate
                ? "Picking... (Click a start date or cancel)"
                : "Import All to Calendar"}
            </span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: INTERACTIVE MONTH CALENDAR (Matching User Reference Image 4)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Calendar Header: Month Title on Left, Navigation Buttons on Right (Matching Image 4) */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{ backgroundColor: activeAccentHex }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer shadow-xs"
            >
              &lt; Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{ backgroundColor: activeAccentHex }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer shadow-xs"
            >
              Next &gt;
            </button>
          </div>
        </div>

        {/* 7-Column Month Calendar Grid (Responsive with Auto-Height & Visual Drag Highlight) */}
        <div className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[700px] lg:min-w-0">
              {/* Day Names Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-center text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider py-2.5">
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
              </div>

              {/* Days Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800 bg-slate-100/50 dark:bg-slate-900/40">
                {calendarDays.map((day) => {
                  const dStr = format(day, "yyyy-MM-dd");
                  const dayPosts = postsByDate[dStr] || [];
                  const isCurrMonth = isSameMonth(day, currentMonth);
                  const isCurrDay = isToday(day);
                  const isBeingDraggedOver = dragOverDate === dStr;

                  return (
                    <div
                      key={dStr}
                      onClick={() => handleDateCellClick(day)}
                      onDragEnter={() => setDragOverDate(dStr)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverDate !== dStr) setDragOverDate(dStr);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        if (dragOverDate === dStr) setDragOverDate(null);
                      }}
                      onDrop={(e) => handleDropPostOnDate(dStr, e)}
                      className={`min-h-[145px] sm:min-h-[165px] h-auto p-1.5 sm:p-2 transition-all duration-150 flex flex-col justify-start gap-1.5 group relative ${
                        isBeingDraggedOver
                          ? "bg-indigo-50/95 dark:bg-indigo-950/70 ring-2 ring-indigo-500 ring-inset shadow-md scale-[1.005] z-10"
                          : isPickingStartDate
                            ? "hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer ring-1 ring-inset ring-amber-300/40"
                            : isCurrMonth
                              ? "bg-white dark:bg-slate-900/80"
                              : "bg-slate-50/60 dark:bg-slate-950/40 text-slate-300 dark:text-slate-700"
                      }`}
                    >
                      {/* Day Header (+ icon on top right & date number on top left) */}
                      <div className="flex items-center justify-between">
                        {/* Date Number Badge */}
                        {isCurrDay ? (
                          <span
                            style={{ backgroundColor: activeAccentHex }}
                            className="w-5.5 h-5.5 rounded-full text-white font-black text-[11px] flex items-center justify-center shadow-xs"
                          >
                            {format(day, "d")}
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-bold ${
                              isCurrMonth
                                ? "text-slate-700 dark:text-slate-300"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                        )}

                        {/* Plus Icon to Add on this date */}
                        <button
                          type="button"
                          onClick={(e) => handleAddDirectPost(day, e)}
                          className="opacity-40 group-hover:opacity-100 hover:text-indigo-600 p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all text-xs font-bold cursor-pointer"
                          title={`Add post on ${format(day, "dd MMM")}`}
                        >
                          +
                        </button>
                      </div>

                      {/* Drop Target Visual Banner */}
                      {isBeingDraggedOver && (
                        <div className="w-full py-1.5 border-2 border-dashed border-indigo-500 bg-indigo-100/70 dark:bg-indigo-900/50 rounded-lg text-center text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-300 animate-pulse shadow-2xs">
                          Drop to place here
                        </div>
                      )}

                      {/* Scheduled Posts in Cell: Stacked One-by-One with auto-expanding cell height */}
                      <div className="w-full space-y-1.5 flex flex-col flex-1">
                        {dayPosts.map((post, postIdx) => {
                          const hasMedia = post.media && post.media.length > 0;
                          const isDraggingThis = draggingPostId === post._id;

                          return (
                            <div
                              key={post._id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, post._id)}
                              onDragEnd={handleDragEnd}
                              className={`p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs space-y-1 relative group/card hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                isDraggingThis
                                  ? "opacity-30 scale-95 ring-2 ring-indigo-500 shadow-xl"
                                  : ""
                              }`}
                            >
                              {/* Circular Dark Delete X Button on Top Right */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  handlePromptDeletePost(post, e)
                                }
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 hover:bg-rose-600 text-white flex items-center justify-center text-[8.5px] shadow-sm z-10 transition-colors cursor-pointer"
                                title="Delete post"
                              >
                                <FiX size={9} />
                              </button>

                              {/* Image preview thumbnail */}
                              {hasMedia ? (
                                <div className="w-full h-14 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                  <img
                                    src={post.media[0].url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-9 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 text-[9px]">
                                  <FiImage size={13} className="opacity-50" />
                                </div>
                              )}

                              {/* Title text + 🔄 Refresh/Sync Icon */}
                              <div className="flex items-center justify-between gap-1">
                                <input
                                  type="text"
                                  defaultValue={post.title}
                                  onBlur={(e) =>
                                    handleUpdatePostField(
                                      post._id,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Title..."
                                  className="w-full text-[10px] font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none truncate"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curIdx = CATEGORIES.indexOf(
                                      post.category,
                                    );
                                    const nextCat =
                                      CATEGORIES[
                                        (curIdx + 1) % CATEGORIES.length
                                      ];
                                    handleUpdatePostField(
                                      post._id,
                                      "category",
                                      nextCat,
                                    );
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                                >
                                  <FiRefreshCw size={9} />
                                </button>
                              </div>

                              {/* Category Dropdown */}
                              <select
                                value={post.category || "Post"}
                                onChange={(e) =>
                                  handleUpdatePostField(
                                    post._id,
                                    "category",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[9.5px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>

                              {/* Link... Input Field */}
                              <input
                                type="text"
                                defaultValue={post.link || ""}
                                onBlur={(e) =>
                                  handleUpdatePostField(
                                    post._id,
                                    "link",
                                    e.target.value,
                                  )
                                }
                                placeholder="Link..."
                                className="w-full px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[9px] text-slate-600 dark:text-slate-400 focus:outline-none"
                              />

                              {/* Description... Input / Textarea */}
                              <div className="relative">
                                <textarea
                                  rows={1}
                                  defaultValue={post.content || ""}
                                  onBlur={(e) =>
                                    handleUpdatePostField(
                                      post._id,
                                      "content",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Description..."
                                  className="w-full px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[9px] text-slate-600 dark:text-slate-400 focus:outline-none resize-none custom-scrollbar"
                                />
                                <FiEdit3
                                  size={9}
                                  className="absolute bottom-1 right-1 text-slate-400 pointer-events-none opacity-60"
                                />
                              </div>

                              {/* Bottom Footer Label: Post 1, Post 2... */}
                              <div className="text-center pt-0.5 border-t border-slate-100 dark:border-slate-700/60">
                                <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">
                                  Post {postIdx + 1}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CLIENT SELECTOR & EXPORT TOOLBAR (Placed BELOW the Calendar)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="space-y-4">
          {/* Client Label & Readonly Display */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Client Name (for PDF & Calendar Export)
            </label>
            <div className="max-w-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white/40"
                  style={{
                    backgroundColor: selectedClient?.color || "#3b82f6",
                  }}
                />
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                  {selectedClient?.companyName || "No Client Selected"}
                </span>
                {selectedClient?.industry && (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    ({selectedClient.industry})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar (Matching Screenshot 3 Colors & Order) */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center flex-wrap gap-2">
              {/* 1. Download Visual PDF (Dark Navy Blue) */}
              <button
                type="button"
                onClick={handleDownloadVisualPDF}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#000080] hover:bg-[#000066] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Download Visual Grid Calendar as PDF"
              >
                <FiDownload size={13} />
                <span>Download Visual PDF</span>
              </button>

              {/* 2. Download Table PDF (Dark Navy Blue) */}
              <button
                type="button"
                onClick={handleDownloadTablePDF}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#00008b] hover:bg-[#000066] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Download Content Table Matrix as PDF"
              >
                <FiDownload size={13} />
                <span>Download Table PDF</span>
              </button>

              {/* 3. Download Combined PDF (Green) */}
              <button
                type="button"
                onClick={handleDownloadCombinedPDF}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#008000] hover:bg-[#006400] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Download Visual Calendar + Content Table PDF"
              >
                <FiDownload size={13} />
                <span>Download Combined PDF</span>
              </button>

              {/* 4. Upload JSON (Dark Slate) */}
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#2f4f4f] hover:bg-[#1f3737] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Import posts from a JSON file"
              >
                <FiUpload size={13} />
                <span>Upload JSON</span>
              </button>

              {/* 5. Download JSON (Slate Dark) */}
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#374151] hover:bg-[#1f2937] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Export calendar posts as JSON"
              >
                <FiDownload size={13} />
                <span>Download JSON</span>
              </button>

              {/* 6. Export for Google Calendar (.ics) (Orange) */}
              <button
                type="button"
                onClick={handleExportICS}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#e65100] hover:bg-[#bf360c] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Export .ics calendar file for Google Calendar / Apple Calendar"
              >
                <FiCalendar size={13} />
                <span>Export for Google Calendar (.ics)</span>
              </button>
            </div>

            {/* Clear All (Red) */}
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#cc0000] hover:bg-[#990000] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <FiTrash2 size={13} />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: TABLE PREVIEW (Matching Reference Image)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <FiFileText className="text-indigo-600 dark:text-indigo-400" />
            <span>Table Preview — {selectedClient?.companyName || "Client"}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {calendarPosts.length} total post(s)
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-3 px-4 w-[110px]">Date</th>
                <th className="py-3 px-4 w-[80px]">Day</th>
                <th className="py-3 px-4 w-[140px]">Content Preview</th>
                <th className="py-3 px-4 min-w-[180px]">Content Name</th>
                <th className="py-3 px-4 w-[120px]">Format</th>
                <th className="py-3 px-4 min-w-[220px]">Short Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {calendarPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                    No scheduled content found for this client.
                  </td>
                </tr>
              ) : (
                calendarPosts.map((post, idx) => {
                  const dObj = post.scheduledDate ? parseISO(post.scheduledDate) : null;
                  const dateStr = dObj ? format(dObj, "dd/MM/yy") : "—";
                  const dayStr = dObj ? format(dObj, "EEE") : "—";
                  const hasMedia = post.media && post.media.length > 0;

                  return (
                    <tr
                      key={post._id || idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400">
                        {dayStr}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasMedia ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-2xs">
                            <img
                              src={post.media[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center text-slate-400 text-[10px]">
                            <FiImage size={18} className="opacity-40" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-white">
                        {post.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {post.category ? `${post.category} ${idx + 1}` : `Post ${idx + 1}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-w-md">
                        {post.content || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CLEAR ALL CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setShowClearModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <FiTrash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Clear All Calendar Posts?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to delete all scheduled posts for{" "}
                  <strong>
                    {selectedClient?.companyName || "this client"}
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={handleClearAllCalendar}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all"
                >
                  {isClearing ? "Clearing..." : "Yes, Clear All"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          SELECT PDF PAGES MODAL (Matching User Reference Image)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pdfModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setPdfModal({ open: false, type: "visual" })}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Select PDF Pages
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Select which months to include in your {pdfModal.type === "combined" ? "combined" : "visual"} PDF. Each month will be a separate page.
                </p>
              </div>

              {/* Checkbox List of Months */}
              <div className="max-h-56 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                {availableMonths.map((m) => {
                  const isChecked = selectedPdfMonths.includes(m.key);
                  return (
                    <label
                      key={m.key}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePdfMonth(m.key)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {m.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPdfModal({ open: false, type: "visual" })}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#000080] hover:bg-[#000066] shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Generate PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          DELETE POST CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deletePostModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() =>
                setDeletePostModal({ open: false, postId: null, title: "" })
              }
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-10 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Delete Post?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to delete{" "}
                  <strong>"{deletePostModal.title}"</strong> from your
                  calendar?
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeletePostModal({ open: false, postId: null, title: "" })
                  }
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePost}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentCalcendor;
