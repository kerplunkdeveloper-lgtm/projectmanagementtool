import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { getUsers } from "../../features/users/userSlice";
import {
  fetchDirectMessages,
  fetchGroupMessages,
  sendMessageAction,
  receiveMessage,
  removeMessage,
  deleteMessageAction,
  fetchRooms,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
  markChatAsRead,
  fetchLastMessages,
} from "../../features/chat/chatSlice";
import {
  FiSend,
  FiUser,
  FiVideo,
  FiPhone,
  FiSmile,
  FiSearch,
  FiChevronLeft,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiCamera,
  FiMessageSquare,
  FiLayers,
  FiPlus,
  FiSettings,
  FiX,
  FiUsers,
  FiTrash2,
  FiLogOut,
  FiDownload,
  FiFileText,
  FiPaperclip,
  FiCornerUpLeft,
  FiArrowRight,
  FiShare2,
  FiMonitor,
  FiCopy,
} from "react-icons/fi";
import io from "socket.io-client";
import toast from "react-hot-toast";
import axiosInstance from "../../services/axiosInstance";

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "😜",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "🤭",
  "🤫",
  "🤥",
  "😶",
  "😐",
  "😑",
  "😬",
  "🙄",
  "🔥",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🙏",
  "🤝",
  "❤️",
  "💔",
  "💖",
  "✨",
  "🎉",
  "🚀",
  "💡",
  "💯",
];

const STICKERS = [
  "👾",
  "🛸",
  "🦄",
  "🐼",
  "🦊",
  "🦁",
  "🐰",
  "🐱",
  "🐶",
  "🐯",
  "🐨",
  "🐷",
  "🐸",
  "🐵",
  "🐒",
  "🐔",
  "🐧",
  "🐦",
  "🦆",
  "🦅",
  "🦉",
  "🦇",
  "🐺",
  "🐗",
  "🐴",
  "🐝",
  "🐛",
  "🦋",
  "🐌",
  "🐞",
  "🐜",
  "🕷️",
  "🦂",
  "🐢",
  "🐍",
  "🦎",
  "🐙",
  "🦑",
  "🦞",
  "🦀",
  "🐡",
  "🐠",
  "🐟",
  "🐬",
  "🐳",
  "🐋",
  "🦈",
  "🐊",
  "🐅",
  "🐆",
  "🦓",
  "🦍",
  "🐘",
  "🦛",
  "🦏",
  "🐪",
  "🐫",
  "🦒",
  "🦘",
  "🐃",
  "🐂",
  "🐄",
  "🐎",
  "🐖",
  "🐏",
  "🐑",
  "🐐",
  "🦌",
  "🐕",
  "🐩",
  "🐈",
  "🐓",
  "🦃",
  "🕊️",
  "🐇",
  "🐁",
  "🐀",
  "🐿️",
  "🦔",
];

const VideoFeed = ({ stream, userName, userAvatar, isMuted, isLocal }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-md">
      {stream && stream.getVideoTracks().length > 0 ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover border border-slate-700 shadow"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-lg font-bold text-blue-400 uppercase shrink-0">
              {userName ? userName.charAt(0) : "U"}
            </div>
          )}
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider truncate max-w-[120px]">
            {userName}
          </span>
        </div>
      )}
      <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-200 flex items-center gap-1.5 border border-slate-800/40">
        <span className="truncate max-w-[80px]">
          {isLocal ? "You" : userName}
        </span>
        {isMuted && (
          <span className="text-red-500 font-black">&bull; Muted</span>
        )}
      </div>
    </div>
  );
};

const ChatPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { users } = useSelector((s) => s.users);
  const { user } = useSelector((s) => s.auth);
  const {
    messages,
    rooms,
    loading,
    unreadCounts = {},
    lastMessages = {},
  } = useSelector((s) => s.chat);

  const [activeChat, setActiveChat] = useState("group"); // 'group' or custom roomId or userId
  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("emoji"); // 'emoji' or 'sticker'
  const [showChatWindowMobile, setShowChatWindowMobile] = useState(false);

  // New Reply, Forward & Share State
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardSearchTerm, setForwardSearchTerm] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(null);
  const [sharingMessage, setSharingMessage] = useState(null);

  // Group Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Group Form Data
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Manage Group Form Data
  const [manageGroupName, setManageGroupName] = useState("");
  const [manageGroupDesc, setManageGroupDesc] = useState("");
  const [manageSelectedMembers, setManageSelectedMembers] = useState([]);

  // Call System State
  const [activeCall, setActiveCall] = useState(null); // 'video' or 'voice' or null
  const [callState, setCallState] = useState("connecting"); // 'connecting', 'connected', 'ended'
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);

  // WebRTC States & Refs
  const [localStream, setLocalStream] = useState(null);
  const [remoteFeeds, setRemoteFeeds] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcsRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const socketRef = useRef();
  const messagesEndRef = useRef();
  const callTimerRef = useRef();
  const fileInputRef = useRef();

  const currentUserId = user?._id || user?.id;

  // Active chat ref to avoid socket listener recreation stale state
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Load chat query param
  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId) {
      setActiveChat(queryId);
      setShowChatWindowMobile(true);
    }
  }, [searchParams]);

  // Mark chat as read
  useEffect(() => {
    if (activeChat) {
      dispatch(markChatAsRead(activeChat));
    }
  }, [activeChat, dispatch]);

  // Load directories and rooms
  useEffect(() => {
    dispatch(getUsers());
    dispatch(fetchRooms());
    dispatch(fetchLastMessages());
  }, [dispatch]);

  // Load chat history on activeChat change
  useEffect(() => {
    if (activeChat === "group" || rooms.some((r) => r._id === activeChat)) {
      dispatch(fetchGroupMessages(activeChat));
    } else {
      dispatch(fetchDirectMessages(activeChat));
    }
  }, [activeChat, rooms, dispatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebRTC Peer Connection Helper
  const createPeerConnection = (targetSocketId, otherUser, isInitiator) => {
    if (pcsRef.current[targetSocketId]) {
      pcsRef.current[targetSocketId].close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pcsRef.current[targetSocketId] = pc;

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("call-send-signal", {
          targetSocketId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    // Handle incoming remote media tracks
    pc.ontrack = (event) => {
      console.log("Received remote track from:", targetSocketId);
      const remoteStream = event.streams[0];
      setRemoteFeeds((prev) => {
        const exists = prev.some((feed) => feed.socketId === targetSocketId);
        if (exists) {
          return prev.map((feed) =>
            feed.socketId === targetSocketId
              ? { ...feed, stream: remoteStream }
              : feed,
          );
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            stream: remoteStream,
            userId: otherUser.userId,
            userName: otherUser.userName,
            userAvatar: otherUser.userAvatar,
            hasVideo: otherUser.hasVideo,
          },
        ];
      });
    };

    // If initiator, create and send offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socketRef.current) {
            socketRef.current.emit("call-send-signal", {
              targetSocketId,
              signal: { type: "offer", sdp: pc.localDescription },
            });
          }
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      };
    }

    return pc;
  };

  // Socket Connection & Real-Time Listeners
  useEffect(() => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    socketRef.current = io(apiBase);

    if (currentUserId) {
      socketRef.current.emit("join", currentUserId);
    }

    socketRef.current.on("direct_message", (msg) => {
      dispatch(
        receiveMessage({
          message: msg,
          currentUserId,
          activeChatId: activeChatRef.current,
        }),
      );
    });

    socketRef.current.on("group_message", (msg) => {
      dispatch(
        receiveMessage({
          message: msg,
          currentUserId,
          activeChatId: activeChatRef.current,
        }),
      );
    });

    socketRef.current.on("message_deleted", ({ messageId }) => {
      dispatch(removeMessage(messageId));
    });

    // WebRTC Signaling listeners
    socketRef.current.on("all-call-users", (usersList) => {
      console.log("All existing users in call room:", usersList);
      usersList.forEach((peer) => {
        setRemoteFeeds((prev) => {
          if (prev.some((f) => f.socketId === peer.socketId)) return prev;
          return [
            ...prev,
            {
              socketId: peer.socketId,
              stream: null,
              userId: peer.userId,
              userName: peer.userName,
              userAvatar: peer.userAvatar,
              hasVideo: peer.hasVideo,
            },
          ];
        });
        createPeerConnection(peer.socketId, peer, true);
      });
    });

    socketRef.current.on("call-user-joined", (peer) => {
      console.log("New user joined call:", peer);
      setRemoteFeeds((prev) => {
        if (prev.some((f) => f.socketId === peer.socketId)) return prev;
        return [
          ...prev,
          {
            socketId: peer.socketId,
            stream: null,
            userId: peer.userId,
            userName: peer.userName,
            userAvatar: peer.userAvatar,
            hasVideo: peer.hasVideo,
          },
        ];
      });
    });

    socketRef.current.on("call-user-left", ({ socketId }) => {
      console.log("User left call:", socketId);
      if (pcsRef.current[socketId]) {
        pcsRef.current[socketId].close();
        delete pcsRef.current[socketId];
      }
      setRemoteFeeds((prev) => prev.filter((f) => f.socketId !== socketId));
    });

    socketRef.current.on(
      "call-signal-received",
      async ({ senderSocketId, signal }) => {
        let pc = pcsRef.current[senderSocketId];

        if (signal.type === "offer") {
          if (!pc) {
            // Attempt to find user info from remote feeds or create a fallback
            let peerInfo = null;
            setRemoteFeeds((prev) => {
              peerInfo = prev.find((f) => f.socketId === senderSocketId);
              return prev;
            });
            if (!peerInfo) {
              peerInfo = {
                userId: "",
                userName: "Peer",
                userAvatar: "",
                hasVideo: true,
              };
            }
            pc = createPeerConnection(senderSocketId, peerInfo, false);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit("call-send-signal", {
            targetSocketId: senderSocketId,
            signal: { type: "answer", sdp: pc.localDescription },
          });
        } else if (signal.type === "answer") {
          if (pc) {
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.sdp),
            );
          }
        } else if (signal.type === "candidate") {
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (err) {
              console.error("Error adding ice candidate:", err);
            }
          }
        }
      },
    );

    return () => {
      socketRef.current.disconnect();
    };
  }, [currentUserId, dispatch]);

  // Call timer effect
  useEffect(() => {
    if (activeCall && callState === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((p) => p + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [activeCall, callState]);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Start Real WebRTC Voice/Video Call
  const startCall = async (type) => {
    setActiveCall(type);
    setCallState("connecting");
    setCallDuration(0);
    setIsMuted(false);
    setIsCamOff(false);
    setRemoteFeeds([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallState("connected");

      // Determine clean, unique Call Room ID
      const roomId =
        activeChat === "group" || rooms.some((r) => r._id === activeChat)
          ? activeChat
          : [currentUserId, activeChat].sort().join("-");

      if (socketRef.current) {
        socketRef.current.emit("join-call-room", {
          roomId,
          userId: currentUserId,
          userName: user.name,
          userAvatar: user.profile?.profileImage?.url,
          hasVideo: type === "video",
        });
      }

      // Automatically post a join button link to the room
      const isGroupType =
        activeChat === "group" || rooms.some((r) => r._id === activeChat);
      const payload = {
        recipient: isGroupType ? null : activeChat,
        chatRoom: isGroupType ? activeChat : "direct",
        text: `📞 Join my live ${type === "video" ? "Video Meet" : "Audio Call"}! Room ID: ${roomId}`,
        messageType: "text",
      };
      await dispatch(sendMessageAction(payload)).unwrap();
      toast.success("Meeting Started");
    } catch (err) {
      console.error("Failed to start WebRTC stream:", err);
      toast.error(
        "Could not access camera/microphone. Please check browser permissions.",
      );
      setCallState("ended");
      setActiveCall(null);
    }
  };

  // Join existing WebRTC Room via clicked meeting invitation
  const joinCallRoom = async (roomId, type) => {
    setActiveCall(type);
    setCallState("connecting");
    setCallDuration(0);
    setIsMuted(false);
    setIsCamOff(false);
    setRemoteFeeds([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallState("connected");

      if (socketRef.current) {
        socketRef.current.emit("join-call-room", {
          roomId,
          userId: currentUserId,
          userName: user.name,
          userAvatar: user.profile?.profileImage?.url,
          hasVideo: type === "video",
        });
      }
      toast.success("Joined Meeting");
    } catch (err) {
      console.error("Failed to join WebRTC stream:", err);
      toast.error(
        "Could not access camera/microphone. Please check browser permissions.",
      );
      setCallState("ended");
      setActiveCall(null);
    }
  };

  // Screen Sharing toggle for Google Meet style functionality
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        const screenVideoTrack = screenStream.getVideoTracks()[0];

        // Replace track in all peer connections
        for (const socketId in pcsRef.current) {
          const senders = pcsRef.current[socketId].getSenders();
          const sender = senders.find(
            (s) => s.track && s.track.kind === "video",
          );
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }
        }

        // Display screen track inside local preview
        const localScreenStream = new MediaStream([
          screenVideoTrack,
          ...(localStreamRef.current
            ? localStreamRef.current.getAudioTracks()
            : []),
        ]);
        setLocalStream(localScreenStream);
        setIsScreenSharing(true);

        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Screen share fail:", err);
        toast.error("Screen sharing canceled");
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const cameraVideoTrack = localStreamRef.current.getVideoTracks()[0];
      for (const socketId in pcsRef.current) {
        const senders = pcsRef.current[socketId].getSenders();
        const sender = senders.find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(cameraVideoTrack);
        }
      }
      setLocalStream(localStreamRef.current);
    }
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  // End call and release camera/screen share streams
  const endCall = async () => {
    setCallState("ended");
    clearInterval(callTimerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setLocalStream(null);
    setIsScreenSharing(false);

    // Close and remove all RTC peer connections
    for (const socketId in pcsRef.current) {
      if (pcsRef.current[socketId]) {
        pcsRef.current[socketId].close();
      }
    }
    pcsRef.current = {};
    setRemoteFeeds([]);

    const roomId =
      activeChat === "group" || rooms.some((r) => r._id === activeChat)
        ? activeChat
        : [currentUserId, activeChat].sort().join("-");

    if (socketRef.current) {
      socketRef.current.emit("leave-call-room", { roomId });
    }

    const durationStr = formatDuration(callDuration);
    const logText = `${activeCall === "video" ? "📹 Video Call" : "📞 Voice Call"} - Duration: ${durationStr}`;

    const payload = {
      recipient:
        activeChat === "group" || rooms.some((r) => r._id === activeChat)
          ? null
          : activeChat,
      chatRoom:
        activeChat === "group" || rooms.some((r) => r._id === activeChat)
          ? activeChat
          : "direct",
      text: logText,
      messageType: "call",
      callStatus: "ended",
      callDuration: durationStr,
    };

    await dispatch(sendMessageAction(payload)).unwrap();
    toast.success("Call Ended");
    setActiveCall(null);
  };

  // Messages form handles
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return toast.error("File is too large. Max size is 50MB.");
    }

    const isGroupType =
      activeChat === "group" || rooms.some((r) => r._id === activeChat);
    const formData = new FormData();
    formData.append("file", file);

    setUploadingFile(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const res = await axiosInstance.post("/messages/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const fileData = res.data.data;

      const payload = {
        recipient: isGroupType ? null : activeChat,
        chatRoom: isGroupType ? activeChat : "direct",
        messageType: "file",
        file: fileData,
        text: `Sent a file: ${fileData.filename}`,
      };

      await dispatch(sendMessageAction(payload)).unwrap();
      toast.success("File sent successfully!", { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "File upload failed", {
        id: toastId,
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    const isGroupType =
      activeChat === "group" || rooms.some((r) => r._id === activeChat);
    const isSingleSticker =
      STICKERS.includes(trimmedText) || EMOJIS.includes(trimmedText);

    const payload = {
      recipient: isGroupType ? null : activeChat,
      chatRoom: isGroupType ? activeChat : "direct",
      ...(isSingleSticker
        ? { sticker: trimmedText, messageType: "sticker" }
        : { text: inputText, messageType: "text" }),
      replyTo: replyingToMessage?._id || null,
    };

    setInputText("");
    setReplyingToMessage(null);
    await dispatch(sendMessageAction(payload)).unwrap();
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await dispatch(deleteMessageAction(messageId)).unwrap();
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err || "Failed to delete message");
    }
  };

  const handleForwardSubmit = async (targetId, type) => {
    if (!forwardingMessage) return;

    const payload = {
      recipient: type === "direct" ? targetId : null,
      chatRoom: type === "group" ? targetId : "direct",
      messageType: forwardingMessage.messageType,
      text: forwardingMessage.text,
      sticker: forwardingMessage.sticker,
      file: forwardingMessage.file,
    };

    try {
      await dispatch(sendMessageAction(payload)).unwrap();
      toast.success("Message forwarded");
      setShowForwardModal(false);
      setForwardingMessage(null);
      setForwardSearchTerm("");
    } catch (err) {
      toast.error(err || "Failed to forward message");
    }
  };

  const handleShareExternal = (msg, platform) => {
    let shareText = "";
    if (msg.messageType === "file" && msg.file) {
      shareText = `Shared File: ${msg.file.filename}\nLink: ${msg.file.url}`;
    } else if (msg.messageType === "sticker") {
      shareText = `Shared Sticker: ${msg.sticker}`;
    } else {
      shareText = msg.text;
    }

    if (platform === "whatsapp") {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(url, "_blank");
    } else if (platform === "email") {
      const url = `mailto:?subject=Shared Chat Message&body=${encodeURIComponent(shareText)}`;
      window.open(url, "_blank");
    }
    setShowShareMenu(null);
  };

  // Create Group Room Action
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error("Please enter a group name");
    }

    try {
      const result = await dispatch(
        createRoomAction({
          name: groupName,
          description: groupDesc,
          members: selectedMembers,
        }),
      ).unwrap();

      toast.success("Group created successfully!");
      setActiveChat(result._id);
      setShowCreateModal(false);
      setGroupName("");
      setGroupDesc("");
      setSelectedMembers([]);
    } catch (err) {
      toast.error(err || "Failed to create group");
    }
  };

  // Open Manage Members overlay
  const handleOpenManageModal = () => {
    const activeRoomObj = rooms.find((r) => r._id === activeChat);
    if (!activeRoomObj) return;

    setManageGroupName(activeRoomObj.name);
    setManageGroupDesc(activeRoomObj.description || "");
    setManageSelectedMembers(activeRoomObj.members.map((m) => m._id));
    setShowManageModal(true);
  };

  // Update Group Room Details / Members
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!manageGroupName.trim()) {
      return toast.error("Group name cannot be empty");
    }

    try {
      await dispatch(
        updateRoomAction({
          id: activeChat,
          roomData: {
            name: manageGroupName,
            description: manageGroupDesc,
            members: manageSelectedMembers,
          },
        }),
      ).unwrap();

      toast.success("Group updated successfully!");
      setShowManageModal(false);
    } catch (err) {
      toast.error(err || "Failed to update group");
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    const activeRoomObj = rooms.find((r) => r._id === activeChat);
    if (!activeRoomObj) return;

    // Filter myself out
    const updatedMembers = activeRoomObj.members
      .map((m) => m._id)
      .filter((id) => id !== currentUserId);

    try {
      await dispatch(
        updateRoomAction({
          id: activeChat,
          roomData: {
            members: updatedMembers,
          },
        }),
      ).unwrap();

      toast.success("You left the group");
      setActiveChat("group");
      setShowManageModal(false);
    } catch (err) {
      toast.error(err || "Failed to leave group");
    }
  };

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      await dispatch(deleteRoomAction(activeChat)).unwrap();
      toast.success("Group deleted successfully");
      setActiveChat("group");
      setShowManageModal(false);
    } catch (err) {
      toast.error(err || "Failed to delete group");
    }
  };

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedMembers((prev) => [...prev, userId]);
    }
  };

  const handleToggleManageMember = (userId) => {
    // Creator cannot be removed
    const activeRoomObj = rooms.find((r) => r._id === activeChat);
    if (activeRoomObj && activeRoomObj.creator._id === userId) return;

    if (manageSelectedMembers.includes(userId)) {
      setManageSelectedMembers((prev) => prev.filter((id) => id !== userId));
    } else {
      setManageSelectedMembers((prev) => [...prev, userId]);
    }
  };

  // Get active conversation target metadata
  const activeCustomRoom = rooms.find((r) => r._id === activeChat);
  const activeChatUser =
    activeChat !== "group" && !activeCustomRoom
      ? users?.find((u) => u._id === activeChat)
      : null;

  const isCreatorOfActiveRoom =
    activeCustomRoom && activeCustomRoom.creator._id === currentUserId;
  const isAdmin = user?.role === "admin";

  const filteredUsers = users?.filter((u) => {
    if (u._id === currentUserId) return false;
    return u.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatLastMessageText = (msg) => {
    if (!msg) return "";
    if (msg.messageType === "sticker") return "🎨 Sent a sticker";
    if (msg.messageType === "file")
      return `📁 Sent a file: ${msg.file?.filename || "Attachment"}`;
    if (msg.messageType === "call") return "📞 Live Call Meet";
    return msg.text;
  };

  const sortedDMs = filteredUsers
    ? [...filteredUsers].sort((a, b) => {
        const msgA = lastMessages[a._id];
        const msgB = lastMessages[b._id];
        const timeA = msgA ? new Date(msgA.createdAt).getTime() : 0;
        const timeB = msgB ? new Date(msgB.createdAt).getTime() : 0;
        return timeB - timeA;
      })
    : [];

  const sortedRooms = rooms
    ? [...rooms].sort((a, b) => {
        const msgA = lastMessages[a._id];
        const msgB = lastMessages[b._id];
        const timeA = msgA ? new Date(msgA.createdAt).getTime() : 0;
        const timeB = msgB ? new Date(msgB.createdAt).getTime() : 0;
        return timeB - timeA;
      })
    : [];

  return (
    <div className="flex h-full w-full bg-slate-50/50 dark:bg-slate-900/40 md:rounded-3xl overflow-hidden border-0 md:border border-slate-100 dark:border-slate-800 shadow-sm relative transition-colors duration-300">
      {/* LEFT PANEL: CHATS & DIRECT MESSAGE DIRECTORY */}
      <div
        className={`w-full md:w-80 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 flex flex-col h-full transition-colors duration-300 ${
          showChatWindowMobile ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-slate-100/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-blue-500 uppercase tracking-wide flex items-center gap-2">
              <FiMessageSquare className="text-blue-500" /> Messaging
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all cursor-pointer"
              title="Create Custom Group"
            >
              <FiPlus size={16} />
            </button>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-550 text-sm" />
            <input
              type="text"
              placeholder="Search team member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white  border border-slate-200   rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/35 focus:border-blue-400 dark:focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-550 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        {/* ROOM TABS */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {/* Global Group Card */}
          <button
            onClick={() => {
              setActiveChat("group");
              setShowChatWindowMobile(true);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
              activeChat === "group"
                ? "bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 font-bold"
                : unreadCounts["group"] > 0
                  ? "bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/20 text-slate-800 dark:text-slate-200 font-extrabold shadow-sm ring-1 ring-blue-500/10"
                  : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-650 dark:text-slate-400 border border-transparent"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
              <FiLayers size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold truncate">
                  General Team Chat
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {unreadCounts["group"] > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[16px] text-center shadow-sm">
                      {unreadCounts["group"]}
                    </span>
                  )}
                  <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">
                    All
                  </span>
                </div>
              </div>
              <p
                className={`text-[10px] truncate mt-0.5 ${unreadCounts["group"] > 0 ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-400 dark:text-slate-500 font-semibold"}`}
              >
                {lastMessages["group"]
                  ? formatLastMessageText(lastMessages["group"])
                  : "All developers and admins"}
              </p>
            </div>
          </button>

          {/* CUSTOM GROUP CHATS */}
          {sortedRooms.length > 0 && (
            <>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
                Custom Groups
              </p>

              {sortedRooms.map((r) => (
                <button
                  key={r._id}
                  onClick={() => {
                    setActiveChat(r._id);
                    setShowChatWindowMobile(true);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                    activeChat === r._id
                      ? "bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 font-bold"
                      : unreadCounts[r._id] > 0
                        ? "bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/20 text-slate-800 dark:text-slate-200 font-extrabold shadow-sm ring-1 ring-blue-500/10"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-650 dark:text-slate-400 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
                    <FiUsers size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-slate-800 dark:text-yellow-50">
                        {r.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unreadCounts[r._id] > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[16px] text-center shadow-sm">
                            {unreadCounts[r._id]}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                          {r.members.length} members
                        </span>
                      </div>
                    </div>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${unreadCounts[r._id] > 0 ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-400 dark:text-slate-500 font-semibold"}`}
                    >
                      {lastMessages[r._id]
                        ? formatLastMessageText(lastMessages[r._id])
                        : r.description || "No description"}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
            Direct Messages
          </p>

          {/* User List */}
          {sortedDMs.length === 0 ? (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-6 font-semibold">
              No members found
            </p>
          ) : (
            sortedDMs.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  setActiveChat(u._id);
                  setShowChatWindowMobile(true);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                  activeChat === u._id
                    ? "bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 font-bold"
                    : unreadCounts[u._id] > 0
                      ? "bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/20 text-slate-800 dark:text-slate-200 font-extrabold shadow-sm ring-1 ring-blue-500/10"
                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-650 dark:text-slate-400 border border-transparent"
                }`}
              >
                <div className="relative shrink-0">
                  {u.profile?.profileImage?.url ? (
                    <img
                      src={u.profile.profileImage.url}
                      alt="profile"
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80 dark:border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-blue-500 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-yellow-100 truncate block">
                      {u.name}
                    </span>
                    {unreadCounts[u._id] > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[16px] text-center shadow-sm">
                        {unreadCounts[u._id]}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${unreadCounts[u._id] > 0 ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-400 dark:text-slate-500 font-semibold"}`}
                  >
                    {lastMessages[u._id]
                      ? formatLastMessageText(lastMessages[u._id])
                      : `${u.role}${u.department ? ` — ${u.department}` : ""}`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ACTIVE CHAT SCREEN */}
      <div
        className={`flex-1 flex flex-col bg-gray-200 dark:bg-gray-100/70 transition-colors duration-300 h-full ${
          showChatWindowMobile ? "flex" : "hidden md:flex"
        }`}
      >
        {/* HEADER */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowChatWindowMobile(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all shrink-0 cursor-pointer"
            >
              <FiChevronLeft size={18} />
            </button>

            {activeChat === "group" ? (
              <>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <FiLayers size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-800 dark:text-blue-500 leading-tight truncate max-w-[120px] sm:max-w-xs">
                    General Team Chat
                  </h3>
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{" "}
                    Active Room
                  </p>
                </div>
              </>
            ) : activeCustomRoom ? (
              <>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <FiUsers size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-800 dark:text-blue-500 leading-tight truncate max-w-[120px] sm:max-w-xs">
                    {activeCustomRoom.name}
                  </h3>
                  <button
                    onClick={handleOpenManageModal}
                    className="text-[9px] text-blue-500 dark:text-blue-400 hover:text-blue-650 dark:hover:text-blue-300 font-bold uppercase tracking-wider leading-none mt-1 flex items-center gap-1 cursor-pointer"
                  >
                    <FiSettings size={10} /> Manage Members
                  </button>
                </div>
              </>
            ) : activeChatUser ? (
              <>
                {activeChatUser.profile?.profileImage?.url ? (
                  <img
                    src={activeChatUser.profile.profileImage.url}
                    alt="profile"
                    className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80 dark:border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-xs shrink-0">
                    {activeChatUser.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-800 dark:text-blue-500 leading-tight truncate max-w-[120px] sm:max-w-xs">
                    {activeChatUser.name}
                  </h3>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold capitalize mt-0.5 leading-none truncate max-w-[120px] sm:max-w-xs">
                    {activeChatUser.role}
                    {activeChatUser.department
                      ? ` — ${activeChatUser.department}`
                      : ""}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* CALL TRIGGER BUTTONS */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => startCall("voice")}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
              title="Voice Call"
            >
              <FiPhone size={14} />
            </button>
            <button
              onClick={() => startCall("video")}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
              title="Video Call"
            >
              <FiVideo size={14} />
            </button>
          </div>
        </div>

        {/* MESSAGES LIST AREA */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3.5 scrollbar-thin bg-chat-wallpaper-light dark:bg-chat-wallpaper-dark">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                Loading conversation...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
              <FiMessageSquare size={32} className="opacity-20 mb-2" />
              <p className="text-xs font-bold">Start the conversation</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Send stickers, call details, or messages
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender?._id === currentUserId;
              const senderInitial = m.sender?.name?.charAt(0) || "?";

              // Check if Call message style
              if (m.messageType === "call") {
                return (
                  <div key={m._id} className="flex justify-center my-2">
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                      {m.text.includes("Video") ? (
                        <FiVideo size={12} />
                      ) : (
                        <FiPhone size={12} />
                      )}
                      <span>{m.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m._id}
                  onClick={() =>
                    setActiveMessageMenu(
                      activeMessageMenu === m._id ? null : m._id,
                    )
                  }
                  className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : ""} group cursor-pointer`}
                >
                  {!isMe &&
                    (m.sender?.profile?.profileImage?.url ? (
                      <img
                        src={m.sender.profile.profileImage.url}
                        alt="profile"
                        className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        {senderInitial}
                      </div>
                    ))}

                  <div
                    className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? "items-end" : ""}`}
                  >
                    {/* Replied message block preview inside bubble */}
                    {m.replyTo && (
                      <div
                        className={`mb-1.5 p-2 rounded-lg border-l-2 bg-slate-50/50 dark:bg-slate-950/30 text-[10px] text-slate-650 dark:text-slate-400 text-left max-w-xs ${
                          isMe
                            ? "border-blue-300"
                            : "border-slate-400 dark:border-slate-600"
                        }`}
                      >
                        <div className="font-extrabold text-slate-700 dark:text-slate-200 text-[9px] mb-0.5">
                          Replying to {m.replyTo.sender?.name || "User"}
                        </div>
                        <div className="truncate opacity-85 font-medium text-[10px]">
                          {m.replyTo.messageType === "file"
                            ? `📁 ${m.replyTo.file?.filename || "Attachment"}`
                            : m.replyTo.messageType === "sticker"
                              ? `🎨 Sticker: ${m.replyTo.sticker}`
                              : m.replyTo.text}
                        </div>
                      </div>
                    )}
                    {/* Sender Label */}
                    {!isMe && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5 ml-1">
                        {m.sender?.name} ({m.sender?.role})
                      </span>
                    )}

                    {/* Content Display */}
                    {m.messageType === "sticker" ? (
                      <div className="text-5xl select-none py-1 filter drop-shadow-md transform active:scale-90 transition-transform">
                        {m.sticker}
                      </div>
                    ) : m.messageType === "file" && m.file ? (
                      <div
                        className={`rounded-[1.25rem] overflow-hidden shadow-sm border max-w-xs md:max-w-sm ${
                          isMe
                            ? "bg-blue-600 text-white border-blue-500 rounded-tr-none"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-none"
                        }`}
                      >
                        {m.file.fileType === "image" ? (
                          <a
                            href={m.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="block relative group cursor-pointer"
                          >
                            <img
                              src={m.file.url}
                              alt={m.file.filename}
                              className="max-h-60 w-full object-cover rounded-t-[1.25rem]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1.5">
                              <FiDownload size={14} /> Open Photo
                            </div>
                            <div className="p-3 bg-black/5 dark:bg-white/5 border-t border-slate-200/10 text-xs font-semibold truncate flex items-center gap-1.5 justify-between">
                              <span className="truncate">
                                {m.file.filename}
                              </span>
                              <span className="text-[9px] opacity-60 font-medium shrink-0">
                                {(m.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </a>
                        ) : m.file.fileType === "video" ? (
                          <div
                            className="p-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <video
                              src={m.file.url}
                              controls
                              className="w-full max-h-60 rounded-[1rem] object-cover bg-black"
                            />
                            <div className="p-2 text-xs font-semibold truncate flex items-center gap-1.5 justify-between">
                              <span className="truncate">
                                {m.file.filename}
                              </span>
                              <span className="text-[9px] opacity-60 font-medium shrink-0">
                                {(m.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        ) : m.file.fileType === "audio" ? (
                          <div
                            className="p-3 w-64"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-xs font-bold truncate mb-2">
                              {m.file.filename}
                            </div>
                            <audio
                              src={m.file.url}
                              controls
                              className="w-full h-8"
                            />
                          </div>
                        ) : (
                          // Document / generic file card
                          <a
                            href={m.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={m.file.filename}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-3 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs cursor-pointer"
                          >
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                              <FiFileText size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold truncate leading-tight">
                                {m.file.filename}
                              </div>
                              <div className="text-[9px] opacity-60 mt-0.5">
                                {(m.file.size / 1024 / 1024).toFixed(2)} MB •
                                File
                              </div>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                              <FiDownload size={12} />
                            </div>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2.5 rounded-[1.25rem] text-xs font-medium leading-relaxed break-words shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none"
                        }`}
                      >
                        {m.text.includes("Join my live") ? (
                          <div className="flex flex-col gap-2.5 p-0.5">
                            <span className="font-semibold">{m.text}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const match = m.text.match(
                                  /Room ID:\s*([a-zA-Z0-9\-_]+)/,
                                );
                                if (match) {
                                  const roomId = match[1];
                                  joinCallRoom(
                                    roomId,
                                    m.text.includes("Video")
                                      ? "video"
                                      : "voice",
                                  );
                                }
                              }}
                              className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                                isMe
                                  ? "bg-white text-blue-600 hover:bg-blue-50"
                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow shadow-blue-500/20"
                              }`}
                            >
                              Join Call Meeting
                            </button>
                          </div>
                        ) : (
                          m.text
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Message Options Menu */}
                  <div
                    className={`flex items-center gap-1 transition-opacity self-center shrink-0 ${
                      isMe ? "flex-row-reverse" : ""
                    } ${
                      activeMessageMenu === m._id
                        ? "opacity-100"
                        : "opacity-0 md:group-hover:opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingToMessage(m);
                        setActiveMessageMenu(null);
                      }}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
                      title="Reply"
                    >
                      <FiCornerUpLeft size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForwardingMessage(m);
                        setShowForwardModal(true);
                        setActiveMessageMenu(null);
                      }}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
                      title="Forward"
                    >
                      <FiArrowRight size={11} />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingMessage(m);
                          setShowShareMenu(
                            showShareMenu === m._id ? null : m._id,
                          );
                        }}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
                        title="Share"
                      >
                        <FiShare2 size={11} />
                      </button>
                      {showShareMenu === m._id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute bottom-7 ${isMe ? "right-0" : "left-0"} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1 shadow-lg z-30 w-28`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareExternal(m, "whatsapp");
                              setActiveMessageMenu(null);
                            }}
                            className="w-full px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-left text-[9px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareExternal(m, "email");
                              setActiveMessageMenu(null);
                            }}
                            className="w-full px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-left text-[9px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            Email
                          </button>
                        </div>
                      )}
                    </div>
                    {(isMe || user.role === "admin") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(m._id);
                          setActiveMessageMenu(null);
                        }}
                        className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                        title="Delete"
                      >
                        <FiTrash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM CONTAINER */}
        <div className="px-2 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative shrink-0 transition-colors duration-300">
          {/* Sticker Picker Drawer */}
          {showStickerPicker && (
            <div className="absolute bottom-16 left-2 right-2 sm:left-4 sm:right-auto bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-xl z-20 w-auto sm:w-72">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerTab("emoji")}
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg cursor-pointer ${
                      pickerTab === "emoji"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    Emojis
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab("sticker")}
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg cursor-pointer ${
                      pickerTab === "sticker"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    Stickers
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStickerPicker(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX size={12} />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                {(pickerTab === "emoji" ? EMOJIS : STICKERS).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + s);
                    }}
                    className="text-2xl p-1 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90 transition-all rounded-lg cursor-pointer flex items-center justify-center"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Replying To Preview Bar */}
          {replyingToMessage && (
            <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between z-10 animate-slide-up">
              <div className="flex items-center gap-2 text-[10px] text-slate-650 dark:text-slate-350 min-w-0">
                <FiCornerUpLeft className="text-blue-500 shrink-0" size={12} />
                <div className="truncate font-medium">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    Replying to {replyingToMessage.sender?.name || "User"}:
                  </span>{" "}
                  <span className="italic opacity-90">
                    {replyingToMessage.messageType === "file"
                      ? `📁 ${replyingToMessage.file?.filename}`
                      : replyingToMessage.messageType === "sticker"
                        ? `🎨 Sticker: ${replyingToMessage.sticker}`
                        : replyingToMessage.text}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="w-5 h-5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <FiX size={10} className="stroke-[3]" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 shrink-0 ${
                uploadingFile
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              title="Attach files, photo, video"
            >
              <FiPaperclip
                size={16}
                className={uploadingFile ? "animate-pulse" : ""}
              />
            </button>

            <button
              type="button"
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                showStickerPicker
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              }`}
              title="Stickers"
            >
              <FiSmile size={16} />
            </button>

            <input
              type="text"
              placeholder="Type message or reply..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-md shadow-blue-100 hover:shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0 cursor-pointer"
            >
              <FiSend size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* FORWARD MESSAGE MODAL */}
      {showForwardModal && forwardingMessage && (
        <div className="fixed inset-0 z-[250] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/25">
              <div>
                <h2 className="text-[13px] font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <FiArrowRight size={14} className="text-blue-500" />
                  Forward Message
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-[9px] font-semibold mt-0.5">
                  Select a recipient or group to forward this message to.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardingMessage(null);
                  setForwardSearchTerm("");
                }}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-400 dark:text-slate-350 hover:text-rose-500 transition-all cursor-pointer shadow-sm"
              >
                <FiX size={12} className="stroke-[3]" />
              </button>
            </div>

            {/* Recipients Search & List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="relative">
                <FiSearch
                  size={12}
                  className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search rooms or people..."
                  value={forwardSearchTerm}
                  onChange={(e) => setForwardSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Group Rooms */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Group Rooms
                </p>
                <div className="space-y-1.5">
                  {rooms
                    .filter((r) =>
                      r.name
                        .toLowerCase()
                        .includes(forwardSearchTerm.toLowerCase()),
                    )
                    .map((r) => (
                      <div
                        key={r._id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent dark:border-transparent dark:hover:border-slate-800 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {r.name}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                            {r.members?.length || 0} members
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleForwardSubmit(r._id, "group")}
                          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Direct Contacts */}
              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Direct Contacts
                </p>
                <div className="space-y-1.5">
                  {users
                    .filter(
                      (u) =>
                        u._id !== currentUserId &&
                        u.name
                          .toLowerCase()
                          .includes(forwardSearchTerm.toLowerCase()),
                    )
                    .map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent dark:border-transparent dark:hover:border-slate-800 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {u.name}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate capitalize">
                            {u.role}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleForwardSubmit(u._id, "direct")}
                          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] p-4 sm:p-6 text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-blue-500 flex items-center gap-2">
                <FiUsers className="text-blue-500" /> Create Custom Group
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGroupName("");
                  setGroupDesc("");
                  setSelectedMembers([]);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateGroup}
              className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin"
            >
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Devs"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What is this group for?"
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  Select Members
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
                  {filteredUsers?.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => handleToggleMember(u._id)}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                          {u.name}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 capitalize block leading-none">
                          {u.role}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setGroupName("");
                    setGroupDesc("");
                    setSelectedMembers([]);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:shadow-blue-200 transition-all cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE GROUP MEMBERS & DETAILS MODAL */}
      {showManageModal && activeCustomRoom && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] p-4 sm:p-6 text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-blue-500 flex items-center gap-2">
                <FiSettings className="text-blue-500" /> Manage Custom Group
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-all cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateGroup}
              className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin"
            >
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={manageGroupName}
                  disabled={!isCreatorOfActiveRoom && !isAdmin}
                  onChange={(e) => setManageGroupName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-slate-700 dark:text-slate-200 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={manageGroupDesc}
                  disabled={!isCreatorOfActiveRoom && !isAdmin}
                  onChange={(e) => setManageGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-slate-700 dark:text-slate-200 resize-none disabled:opacity-60"
                />
              </div>

              {/* Members Checklist / Viewer */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  {isCreatorOfActiveRoom || isAdmin
                    ? "Add/Remove Members"
                    : "Group Members"}
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
                  {filteredUsers?.map((u) => {
                    const isChecked = manageSelectedMembers.includes(u._id);
                    const isRoomCreator =
                      activeCustomRoom.creator._id === u._id;

                    // Non-creator/Non-admin just see members
                    if (!isCreatorOfActiveRoom && !isAdmin) {
                      if (!isChecked) return null;
                      return (
                        <div
                          key={u._id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-850"
                        >
                          <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {u.name} ({u.role})
                          </span>
                        </div>
                      );
                    }

                    // Creator/Admin see checkboxes to toggle
                    return (
                      <label
                        key={u._id}
                        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none ${
                          isRoomCreator ? "opacity-55 cursor-not-allowed" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || isRoomCreator}
                          disabled={isRoomCreator}
                          onChange={() => handleToggleManageMember(u._id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                            {u.name}{" "}
                            {isRoomCreator && (
                              <span className="text-[9px] text-amber-500 font-bold ml-1">
                                (Creator)
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 capitalize block leading-none">
                            {u.role}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {/* Delete / Leave Actions */}
                <div className="flex items-center gap-2">
                  {isCreatorOfActiveRoom || isAdmin ? (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      className="px-3.5 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Delete Group"
                    >
                      <FiTrash2 size={13} /> Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLeaveGroup}
                      className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Leave Group"
                    >
                      <FiLogOut size={13} /> Leave Group
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManageModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  {(isCreatorOfActiveRoom || isAdmin) && (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:shadow-blue-200 transition-all cursor-pointer"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM CALLING INTERFACE OVERLAY */}
      {activeCall &&
        (() => {
          const roomId =
            activeChat === "group" || activeCustomRoom
              ? activeChat
              : [currentUserId, activeChat].sort().join("-");

          const handleCopyRoomId = () => {
            navigator.clipboard.writeText(roomId);
            toast.success("Meeting Room ID copied!");
          };

          const totalFeeds = 1 + remoteFeeds.length;
          const gridCols =
            totalFeeds === 1
              ? "grid-cols-1"
              : totalFeeds === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-2 lg:grid-cols-3";

          return (
            <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
              <div className="bg-slate-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col relative text-white h-[80vh] sm:h-[65vh]">
                {/* Meeting Header */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-full border border-slate-750 text-[10px] font-black uppercase text-slate-350">
                  <span>Room ID: {roomId.slice(0, 15)}...</span>
                  <button
                    onClick={handleCopyRoomId}
                    className="hover:text-white cursor-pointer transition-colors"
                    title="Copy Meeting Room ID"
                  >
                    <FiCopy size={11} />
                  </button>
                </div>

                {/* Call State: Connecting */}
                {callState === "connecting" && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    {activeChat === "group" || activeCustomRoom ? (
                      <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-black text-2xl text-slate-350 animate-pulse">
                        G
                      </div>
                    ) : activeChatUser?.profile?.profileImage?.url ? (
                      <img
                        src={activeChatUser.profile.profileImage.url}
                        alt="avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-600 animate-pulse shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-black text-2xl text-slate-350 animate-pulse shrink-0">
                        {activeChatUser?.name.charAt(0) || "C"}
                      </div>
                    )}
                    <div className="text-center">
                      <h4 className="text-sm font-bold tracking-wide">
                        {activeChat === "group"
                          ? "General Group Video Call"
                          : activeCustomRoom
                            ? `${activeCustomRoom.name} Group Call`
                            : activeChatUser?.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black animate-pulse">
                        Connecting call...
                      </p>
                    </div>
                  </div>
                )}

                {/* Call State: Connected */}
                {callState === "connected" && (
                  <div className="flex-1 flex flex-col relative bg-slate-950 p-4 pt-16 overflow-y-auto">
                    {activeCall === "video" ? (
                      <div
                        className={`grid ${gridCols} gap-3 items-center justify-center w-full my-auto`}
                      >
                        {/* Local Preview */}
                        <VideoFeed
                          stream={localStream}
                          userName={`${user?.name} (You)`}
                          userAvatar={user?.profile?.profileImage?.url}
                          isLocal={true}
                          isMuted={isMuted}
                        />
                        {/* Remote Feeds */}
                        {remoteFeeds.map((feed) => (
                          <VideoFeed
                            key={feed.socketId}
                            stream={feed.stream}
                            userName={feed.userName}
                            userAvatar={feed.userAvatar}
                            isLocal={false}
                            isMuted={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 my-auto">
                        <div className="flex items-center justify-center -space-x-3">
                          <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <FiPhone
                              className="text-blue-500 animate-bounce"
                              size={20}
                            />
                          </div>
                          {remoteFeeds.map((feed) =>
                            feed.userAvatar ? (
                              <img
                                key={feed.socketId}
                                src={feed.userAvatar}
                                alt="avatar"
                                className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div
                                key={feed.socketId}
                                className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0"
                              >
                                {feed.userName.charAt(0)}
                              </div>
                            ),
                          )}
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm font-bold">
                            {activeChat === "group"
                              ? "Group Voice Room"
                              : activeCustomRoom
                                ? activeCustomRoom.name
                                : activeChatUser?.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 tracking-wide font-black mt-1">
                            ONGOING MEETING &bull;{" "}
                            {formatDuration(callDuration)}
                          </p>
                          <span className="text-[9px] text-slate-500 font-semibold block mt-1.5">
                            {remoteFeeds.length} other person
                            {remoteFeeds.length !== 1 ? "s" : ""} joined
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CALL CONTROLS DRAWER */}
                <div className="h-16 bg-slate-900 border-t border-slate-850 flex items-center justify-between px-6 shrink-0 z-10">
                  <div className="flex items-center gap-3">
                    {/* Microphone Toggle */}
                    <button
                      onClick={toggleMic}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isMuted
                          ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                          : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50"
                      }`}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
                    </button>

                    {/* Camera Toggle */}
                    {activeCall === "video" && (
                      <button
                        onClick={toggleCamera}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isCamOff
                            ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                            : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50"
                        }`}
                        title={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
                      >
                        {isCamOff ? (
                          <FiVideoOff size={14} />
                        ) : (
                          <FiCamera size={14} />
                        )}
                      </button>
                    )}

                    {/* Screen Share Toggle */}
                    {activeCall === "video" && (
                      <button
                        onClick={toggleScreenShare}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isScreenSharing
                            ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
                            : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/50"
                        }`}
                        title={
                          isScreenSharing ? "Stop Screen Share" : "Share Screen"
                        }
                      >
                        <FiMonitor size={14} />
                      </button>
                    )}
                  </div>

                  {callState === "connected" && (
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest hidden xs:inline">
                      {formatDuration(callDuration)}
                    </span>
                  )}

                  <button
                    onClick={endCall}
                    className="px-5 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/30 active:scale-95 transition-all cursor-pointer"
                  >
                    Leave Meeting
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default ChatPage;
