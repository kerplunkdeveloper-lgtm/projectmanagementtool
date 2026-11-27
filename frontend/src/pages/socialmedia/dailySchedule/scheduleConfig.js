import {
  FiTarget,
  FiBarChart2,
  FiMonitor,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaUsers,
  FaListUl,
  FaHandshake,
  FaCalendarAlt,
  FaLightbulb,
  FaImage,
  FaFileAlt,
} from "react-icons/fa";
import { HiOutlineShieldCheck, HiOutlineUserGroup } from "react-icons/hi2";

// 15 standard routine slots for a Social Media Executive's day.
// Keep in sync with DEFAULT_SCHEDULE_SLOTS in backend/controllers/smDailyScheduleController.js
// (the backend copy is the source of truth; this copy gives an instant first paint).
export const DEFAULT_SCHEDULE_SLOTS = [
  {
    slotId: "slot-1",
    timeRange: "9:00 – 9:15 AM",
    startTime: "09:00",
    endTime: "09:15",
    title: "WhatsApp Group Review",
    points: [
      "Check all client WhatsApp groups.",
      "Review new requests, updates, approvals and pending requirements.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-1-sub-1", text: "Check all client WhatsApp groups" },
      { id: "slot-1-sub-2", text: "Review new requests, updates, approvals & pending requirements" },
    ],
  },
  {
    slotId: "slot-2",
    timeRange: "9:15 – 9:30 AM",
    startTime: "09:15",
    endTime: "09:30",
    title: "Designer & Videographer Work Allocation",
    points: [
      "Assign designer and videographer tasks.",
      "Review previous-day pending works.",
      "Schedule and prioritise today’s deliverables.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-2-sub-1", text: "Assign designer and videographer tasks" },
      { id: "slot-2-sub-2", text: "Review previous-day pending works" },
      { id: "slot-2-sub-3", text: "Schedule and prioritise today’s deliverables" },
    ],
  },
  {
    slotId: "slot-3",
    timeRange: "9:30 – 9:45 AM",
    startTime: "09:30",
    endTime: "09:45",
    title: "Social Media Work Update",
    points: [
      "Review and update SM tasks client-wise.",
      "Ensure all tasks are properly sorted and prioritised for each client.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-3-sub-1", text: "Review and update SM tasks client-wise" },
      { id: "slot-3-sub-2", text: "Ensure all tasks are properly sorted and prioritised for each client" },
    ],
  },
  {
    slotId: "slot-4",
    timeRange: "9:45 – 10:30 AM",
    startTime: "09:45",
    endTime: "10:30",
    title: "Story Posting & Engagement",
    points: [
      "Add and schedule the day’s stories.",
      "Ensure 1 CTA link is included.",
      "Add 1 quiz or poll-based story for engagement.",
    ],
    benchmark: "Must include 1 CTA link + 1 quiz/poll-based story",
    subtasks: [
      { id: "slot-4-sub-1", text: "Add and schedule the day’s stories" },
      { id: "slot-4-sub-2", text: "Ensure 1 CTA link is included" },
      { id: "slot-4-sub-3", text: "Add 1 quiz or poll-based story for engagement" },
    ],
  },
  {
    slotId: "slot-5",
    timeRange: "10:30 – 11:30 AM",
    startTime: "10:30",
    endTime: "11:30",
    title: "Social Media Analytics Review",
    points: [
      "Capture and review story and post analytics.",
      "Analyse the last 3 posts: Likes, Comments, Reach/engagement, Follower growth.",
      "Identify content that is performing well and areas that need improvement.",
    ],
    benchmark: "Review story analytics & last 3 posts performance metrics",
    subtasks: [
      { id: "slot-5-sub-1", text: "Capture and review story and post analytics" },
      { id: "slot-5-sub-2", text: "Analyse last 3 posts: Likes, Comments, Reach, Follower growth" },
      { id: "slot-5-sub-3", text: "Identify high-performing content & improvement areas" },
    ],
  },
  {
    slotId: "slot-6",
    timeRange: "11:30 AM – 1:00 PM",
    startTime: "11:30",
    endTime: "13:00",
    title: "Client Follow-ups & Execution",
    points: [
      "Review pending tasks for each client.",
      "Follow up on pending approvals and requirements.",
      "Execute MOM-based action points.",
      "Plan campaigns and offers for each client.",
      "Review and respond to GMB reviews.",
    ],
    benchmark: "MOM execution & GMB review replies",
    subtasks: [
      { id: "slot-6-sub-1", text: "Review pending tasks for each client" },
      { id: "slot-6-sub-2", text: "Follow up on pending approvals & requirements" },
      { id: "slot-6-sub-3", text: "Execute MOM-based action points" },
      { id: "slot-6-sub-4", text: "Plan campaigns and offers for each client" },
      { id: "slot-6-sub-5", text: "Review and respond to GMB reviews" },
    ],
  },
  {
    slotId: "slot-7",
    timeRange: "1:00 – 1:30 PM",
    startTime: "13:00",
    endTime: "13:30",
    title: "First-Half Designer Work Review",
    points: [
      "Check all designers’ first-half work.",
      "Review completed, pending and ongoing tasks.",
      "Update and organise work status client-wise.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-7-sub-1", text: "Check all designers’ first-half work" },
      { id: "slot-7-sub-2", text: "Review completed, pending and ongoing tasks" },
      { id: "slot-7-sub-3", text: "Update and organise work status client-wise" },
    ],
  },
  {
    slotId: "slot-8",
    timeRange: "2:15 – 2:30 PM",
    startTime: "14:15",
    endTime: "14:30",
    title: "Second-Half Work Planning",
    points: [
      "Plan and assign second-half tasks for designers and videographers.",
      "Re-prioritise urgent and deadline-based deliverables.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-8-sub-1", text: "Plan & assign 2nd-half tasks for designers and videographers" },
      { id: "slot-8-sub-2", text: "Re-prioritise urgent and deadline deliverables" },
    ],
  },
  {
    slotId: "slot-9",
    timeRange: "2:30 – 3:30 PM",
    startTime: "14:30",
    endTime: "15:30",
    title: "Competitor Deep Scan",
    points: [
      "Research relevant competitors and identify: Offers, Content hooks, Campaign ideas, Collaborations, Trending strategies.",
    ],
    benchmark: "1 India-level competitor | 1 Global competitor | 3 Local competitors",
    subtasks: [
      { id: "slot-9-sub-1", text: "1 India-level competitor scan (Offers, Hooks, Campaigns)" },
      { id: "slot-9-sub-2", text: "1 Global competitor scan (Collaborations, Trends)" },
      { id: "slot-9-sub-3", text: "3 Local competitors scan (Regional trends & strategies)" },
    ],
  },
  {
    slotId: "slot-10",
    timeRange: "3:30 – 4:00 PM",
    startTime: "15:30",
    endTime: "16:00",
    title: "Growth & Client Account Review",
    points: [
      "DM 3 Micro/Nano barter influencers per client for collaborations.",
      "Plan story additions, discount/gift-based collaborations.",
      "Conduct website audit.",
      "Check GMB updates and reviews.",
      "Update Instagram Highlights.",
      "Cross-check Facebook.",
      "QC the last 1 week of posts.",
      "Review sales reports.",
      "Handle client calls and follow-ups.",
    ],
    benchmark: "DM 3 Micro/Nano barter influencers per client",
    subtasks: [
      { id: "slot-10-sub-1", text: "DM 3 Micro/Nano barter influencers per client" },
      { id: "slot-10-sub-2", text: "Plan story additions & discount/gift collaborations" },
      { id: "slot-10-sub-3", text: "Conduct website audit & check GMB updates" },
      { id: "slot-10-sub-4", text: "Update Instagram Highlights & cross-check Facebook" },
      { id: "slot-10-sub-5", text: "QC last 1 week of posts & review sales reports" },
      { id: "slot-10-sub-6", text: "Handle client calls and follow-ups" },
    ],
  },
  {
    slotId: "slot-11",
    timeRange: "4:15 – 5:00 PM",
    startTime: "16:15",
    endTime: "17:00",
    title: "Next-Day Content Planning",
    points: [
      "Plan next day’s story sequence.",
      "Brainstorm hooks for reels.",
      "Prepare the next day’s reel plan.",
      "Prepare tomorrow’s post caption.",
      "Research relevant reel trends and content formats.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-11-sub-1", text: "Plan next day’s story sequence" },
      { id: "slot-11-sub-2", text: "Brainstorm hooks for reels & reel plan" },
      { id: "slot-11-sub-3", text: "Prepare tomorrow’s post caption" },
      { id: "slot-11-sub-4", text: "Research relevant reel trends and content formats" },
    ],
  },
  {
    slotId: "slot-12",
    timeRange: "5:00 – 5:15 PM",
    startTime: "17:00",
    endTime: "17:15",
    title: "Designer & Videographer Work Review",
    points: [
      "Check the day’s completed and pending work.",
      "Ensure priority deliverables are on track.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-12-sub-1", text: "Check the day’s completed and pending work" },
      { id: "slot-12-sub-2", text: "Ensure priority deliverables are on track" },
    ],
  },
  {
    slotId: "slot-13",
    timeRange: "5:15 – 5:30 PM",
    startTime: "17:15",
    endTime: "17:30",
    title: "Final QC & Client Group Update",
    points: [
      "QC today’s post.",
      "Share the approved post/content in the respective client group.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-13-sub-1", text: "QC today’s post thoroughly" },
      { id: "slot-13-sub-2", text: "Share approved post/content in respective client WhatsApp group" },
    ],
  },
  {
    slotId: "slot-14",
    timeRange: "5:30 – 5:45 PM",
    startTime: "17:30",
    endTime: "17:45",
    title: "EOD Reporting",
    points: [
      "Prepare and share EOD reports for all client groups.",
      "Mention completed, pending and carry-forward tasks.",
    ],
    benchmark: "Completed, pending & carry-forward tasks breakdown",
    subtasks: [
      { id: "slot-14-sub-1", text: "Prepare and share EOD reports for all client groups" },
      { id: "slot-14-sub-2", text: "Mention completed, pending and carry-forward tasks" },
    ],
  },
  {
    slotId: "slot-15",
    timeRange: "5:45 – 6:00 PM",
    startTime: "17:45",
    endTime: "18:00",
    title: "Daily Team Meeting",
    points: [
      "Review the day’s execution.",
      "Discuss pending/blocked tasks.",
      "Confirm priorities and responsibilities for the next day.",
    ],
    benchmark: "",
    subtasks: [
      { id: "slot-15-sub-1", text: "Review the day’s execution" },
      { id: "slot-15-sub-2", text: "Discuss pending / blocked tasks" },
      { id: "slot-15-sub-3", text: "Confirm priorities & responsibilities for next day" },
    ],
  },
];

export const TOTAL_SLOTS = DEFAULT_SCHEDULE_SLOTS.length;

// Activity icon + colour per slot
export const SLOT_ACTIVITY_ICONS = {
  "slot-1": {
    Icon: FaWhatsapp,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
  },
  "slot-2": {
    Icon: FaUsers,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-3": {
    Icon: FaListUl,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-4": {
    Icon: FiTarget,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60",
  },
  "slot-5": {
    Icon: FiBarChart2,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-6": {
    Icon: FaHandshake,
    iconColor: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
  },
  "slot-7": {
    Icon: FiMonitor,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-8": {
    Icon: FaCalendarAlt,
    iconColor: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/60",
  },
  "slot-9": {
    Icon: FiSearch,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800/60",
  },
  "slot-10": {
    Icon: FiTrendingUp,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
  },
  "slot-11": {
    Icon: FaLightbulb,
    iconColor: "text-amber-500 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
  },
  "slot-12": {
    Icon: FaImage,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
  },
  "slot-13": {
    Icon: HiOutlineShieldCheck,
    iconColor: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/60",
  },
  "slot-14": {
    Icon: FaFileAlt,
    iconColor: "text-amber-800 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
  },
  "slot-15": {
    Icon: HiOutlineUserGroup,
    iconColor: "text-purple-700 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60",
  },
};

export const DEFAULT_SLOT_ICON = {
  iconColor: "text-slate-600 dark:text-slate-400",
  bgClass: "bg-slate-100 dark:bg-[#131d31] border-slate-200 dark:border-white/10",
};

// Four phases of the day, used for the timeline rail colour and section labels
const PHASES = [
  { maxSlot: 3, key: "morning", label: "Morning Setup", color: "#10b981" },
  { maxSlot: 5, key: "posting", label: "Posting & Analytics", color: "#0ea5e9" },
  { maxSlot: 7, key: "execution", label: "Execution & Review", color: "#6366f1" },
  { maxSlot: Infinity, key: "eod", label: "Afternoon & EOD", color: "#f59e0b" },
];

export const getSlotNumber = (slotId) => parseInt((slotId || "").replace("slot-", ""), 10) || 1;

export const getSlotPhase = (slotId) => {
  const num = getSlotNumber(slotId);
  return PHASES.find((p) => num <= p.maxSlot);
};
