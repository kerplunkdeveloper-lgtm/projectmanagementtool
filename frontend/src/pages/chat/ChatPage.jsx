import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getUsers } from "../../features/users/userSlice";
import {
  fetchDirectMessages,
  fetchGroupMessages,
  sendMessageAction,
  receiveMessage,
  fetchRooms,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
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
} from "react-icons/fi";
import io from "socket.io-client";
import toast from "react-hot-toast";

const STICKERS = ["👾", "🚀", "🎉", "🔥", "👏", "❤️", "😂", "👍", "💡", "💯", "🌟", "✨"];

const ChatPage = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((s) => s.users);
  const { user } = useSelector((s) => s.auth);
  const { messages, rooms, loading } = useSelector((s) => s.chat);

  const [activeChat, setActiveChat] = useState("group"); // 'group' or custom roomId or userId
  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showChatWindowMobile, setShowChatWindowMobile] = useState(false);

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

  const socketRef = useRef();
  const messagesEndRef = useRef();
  const callTimerRef = useRef();

  const currentUserId = user?._id || user?.id;

  // Load directories and rooms
  useEffect(() => {
    dispatch(getUsers());
    dispatch(fetchRooms());
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

  // Socket Connection & Real-Time Listeners
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    socketRef.current = io(apiBase);

    if (currentUserId) {
      socketRef.current.emit("join", currentUserId);
    }

    socketRef.current.on("direct_message", (msg) => {
      const otherUser = msg.sender._id === currentUserId ? msg.recipient._id : msg.sender._id;
      if (activeChat === otherUser) {
        dispatch(receiveMessage(msg));
      }
    });

    socketRef.current.on("group_message", (msg) => {
      if (activeChat === msg.chatRoom) {
        dispatch(receiveMessage(msg));
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [activeChat, currentUserId, dispatch]);

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

  // Start Voice/Video Call
  const startCall = (type) => {
    setActiveCall(type);
    setCallState("connecting");
    setCallDuration(0);
    setIsMuted(false);
    setIsCamOff(false);

    setTimeout(() => {
      setCallState("connected");
    }, 2500);
  };

  // End Call
  const endCall = async () => {
    setCallState("ended");
    clearInterval(callTimerRef.current);

    const durationStr = formatDuration(callDuration);
    const logText = `${activeCall === "video" ? "📹 Video Call" : "📞 Voice Call"} - Duration: ${durationStr}`;

    const payload = {
      recipient: activeChat === "group" || rooms.some((r) => r._id === activeChat) ? null : activeChat,
      chatRoom: activeChat === "group" || rooms.some((r) => r._id === activeChat) ? activeChat : "direct",
      text: logText,
      messageType: "call",
      callStatus: "ended",
      callDuration: durationStr,
    };

    await dispatch(sendMessageAction(payload)).unwrap();
    toast.success("Call Logged");
    setActiveCall(null);
  };

  // Messages form handles
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const isGroupType = activeChat === "group" || rooms.some((r) => r._id === activeChat);

    const payload = {
      recipient: isGroupType ? null : activeChat,
      chatRoom: isGroupType ? activeChat : "direct",
      text: inputText,
      messageType: "text",
    };

    setInputText("");
    await dispatch(sendMessageAction(payload)).unwrap();
  };

  const handleSendSticker = async (sticker) => {
    setShowStickerPicker(false);
    const isGroupType = activeChat === "group" || rooms.some((r) => r._id === activeChat);

    const payload = {
      recipient: isGroupType ? null : activeChat,
      chatRoom: isGroupType ? activeChat : "direct",
      sticker,
      messageType: "sticker",
    };
    await dispatch(sendMessageAction(payload)).unwrap();
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
        })
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
        })
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
        })
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
  const activeChatUser = activeChat !== "group" && !activeCustomRoom ? users?.find((u) => u._id === activeChat) : null;

  const isCreatorOfActiveRoom = activeCustomRoom && activeCustomRoom.creator._id === currentUserId;
  const isAdmin = user?.role === "admin";

  const filteredUsers = users?.filter((u) => {
    if (u._id === currentUserId) return false;
    return u.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
      
      {/* LEFT PANEL: CHATS & DIRECT MESSAGE DIRECTORY */}
      <div
        className={`w-full md:w-80 shrink-0 bg-white border-r border-slate-100 flex flex-col ${
          showChatWindowMobile ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="border-b border-slate-100/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FiMessageSquare className="text-blue-500" /> Messaging
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all cursor-pointer"
              title="Create Custom Group"
            >
              <FiPlus size={16} />
            </button>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search team member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 text-slate-700"
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
                ? "bg-blue-50/60 border border-blue-100 text-blue-900 font-bold"
                : "hover:bg-slate-50/60 text-slate-600 border border-transparent"
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
              <FiLayers size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold truncate">General Team Chat</span>
                <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">All</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate font-semibold mt-0.5">All developers and admins</p>
            </div>
          </button>

          {/* CUSTOM GROUP CHATS */}
          {rooms.length > 0 && (
            <>
              <div className="h-px bg-slate-100 my-2" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5">Custom Groups</p>
              
              {rooms.map((r) => (
                <button
                  key={r._id}
                  onClick={() => {
                    setActiveChat(r._id);
                    setShowChatWindowMobile(true);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                    activeChat === r._id
                      ? "bg-blue-50/60 border border-blue-100 text-blue-900 font-bold"
                      : "hover:bg-slate-50/60 text-slate-600 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
                    <FiUsers size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-slate-800">{r.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{r.members.length} members</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate font-semibold mt-0.5">
                      {r.description || "No description"}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          <div className="h-px bg-slate-100 my-2" />
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5">Direct Messages</p>

          {/* User List */}
          {filteredUsers?.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-6 font-semibold">No members found</p>
          ) : (
            filteredUsers?.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  setActiveChat(u._id);
                  setShowChatWindowMobile(true);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                  activeChat === u._id
                    ? "bg-blue-50/60 border border-blue-100 text-blue-900 font-bold"
                    : "hover:bg-slate-50/60 text-slate-600 border border-transparent"
                }`}
              >
                <div className="relative shrink-0">
                  {u.profile?.profileImage?.url ? (
                    <img
                      src={u.profile.profileImage.url}
                      alt="profile"
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate block">{u.name}</span>
                  <p className="text-[9px] text-slate-400 font-semibold capitalize mt-0.5 truncate">
                    {u.role} — {u.department || "No Dept"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ACTIVE CHAT SCREEN */}
      <div
        className={`flex-1 flex flex-col bg-slate-50/30 ${
          showChatWindowMobile ? "flex" : "hidden md:flex"
        }`}
      >
        {/* HEADER */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowChatWindowMobile(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all shrink-0"
            >
              <FiChevronLeft size={18} />
            </button>

            {activeChat === "group" ? (
              <>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <FiLayers size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-800 leading-tight">General Team Chat</h3>
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-wider leading-none mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active Room
                  </p>
                </div>
              </>
            ) : activeCustomRoom ? (
              <>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <FiUsers size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-800 leading-tight truncate max-w-[150px] sm:max-w-xs">{activeCustomRoom.name}</h3>
                  <button
                    onClick={handleOpenManageModal}
                    className="text-[9px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider leading-none mt-1 flex items-center gap-1 cursor-pointer"
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
                    className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-black text-slate-700 text-xs shrink-0">
                    {activeChatUser.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-slate-800 leading-tight">{activeChatUser.name}</h3>
                  <p className="text-[9px] text-slate-400 font-semibold capitalize mt-0.5 leading-none">
                    {activeChatUser.role} — {activeChatUser.department || "No Department"}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* CALL TRIGGER BUTTONS */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => startCall("voice")}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
              title="Voice Call"
            >
              <FiPhone size={14} />
            </button>
            <button
              onClick={() => startCall("video")}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
              title="Video Call"
            >
              <FiVideo size={14} />
            </button>
          </div>
        </div>

        {/* MESSAGES LIST AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-slate-400 font-semibold">Loading conversation...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FiMessageSquare size={32} className="opacity-20 mb-2" />
              <p className="text-xs font-bold">Start the conversation</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Send stickers, call details, or messages</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender?._id === currentUserId;
              const senderInitial = m.sender?.name?.charAt(0) || "?";

              // Check if Call message style
              if (m.messageType === "call") {
                return (
                  <div key={m._id} className="flex justify-center my-2">
                    <div className="bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold text-slate-600 shadow-sm">
                      {m.text.includes("Video") ? <FiVideo size={12} /> : <FiPhone size={12} />}
                      <span>{m.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m._id} className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && (
                    m.sender?.profile?.profileImage?.url ? (
                      <img
                        src={m.sender.profile.profileImage.url}
                        alt="profile"
                        className="w-7 h-7 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 border border-slate-300 text-[10px] font-black text-slate-700 flex items-center justify-center shrink-0">
                        {senderInitial}
                      </div>
                    )
                  )}

                  <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : ""}`}>
                    {/* Sender Label */}
                    {!isMe && (
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 ml-1">
                        {m.sender?.name} ({m.sender?.role})
                      </span>
                    )}

                    {/* Content Display */}
                    {m.messageType === "sticker" ? (
                      <div className="text-5xl select-none py-1 filter drop-shadow-md transform active:scale-90 transition-transform">
                        {m.sticker}
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2.5 rounded-[1.25rem] text-xs font-medium leading-relaxed break-words shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                        }`}
                      >
                        {m.text}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[9px] text-slate-400 font-semibold mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM CONTAINER */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 relative shrink-0">
          
          {/* Sticker Picker Drawer */}
          {showStickerPicker && (
            <div className="absolute bottom-16 left-4 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xl z-20 w-64">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-wider">Premium Team Stickers</p>
              <div className="grid grid-cols-6 gap-2">
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSendSticker(s)}
                    className="text-2xl p-1 hover:bg-slate-50 active:scale-90 transition-all rounded-lg cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                showStickerPicker ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600"
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
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-md shadow-blue-100 hover:shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0"
            >
              <FiSend size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* CREATE CUSTOM GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col p-6 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <FiUsers className="text-blue-500" /> Create Custom Group
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGroupName("");
                  setGroupDesc("");
                  setSelectedMembers([]);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Devs"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Description (Optional)</label>
                <textarea
                  placeholder="What is this group for?"
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Select Members</label>
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 bg-slate-50/50 scrollbar-thin">
                  {filteredUsers?.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => handleToggleMember(u._id)}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-700 block truncate">{u.name}</span>
                        <span className="text-[9px] text-slate-400 capitalize block leading-none">{u.role}</span>
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:shadow-blue-200 transition-all"
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
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col p-6 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <FiSettings className="text-blue-500" /> Manage Custom Group
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Group Name</label>
                <input
                  type="text"
                  value={manageGroupName}
                  disabled={!isCreatorOfActiveRoom && !isAdmin}
                  onChange={(e) => setManageGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={manageGroupDesc}
                  disabled={!isCreatorOfActiveRoom && !isAdmin}
                  onChange={(e) => setManageGroupDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 resize-none disabled:opacity-60"
                />
              </div>

              {/* Members Checklist / Viewer */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  {(isCreatorOfActiveRoom || isAdmin) ? "Add/Remove Members" : "Group Members"}
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 bg-slate-50/50 scrollbar-thin">
                  {filteredUsers?.map((u) => {
                    const isChecked = manageSelectedMembers.includes(u._id);
                    const isRoomCreator = activeCustomRoom.creator._id === u._id;

                    // Non-creator/Non-admin just see members
                    if (!isCreatorOfActiveRoom && !isAdmin) {
                      if (!isChecked) return null;
                      return (
                        <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-100">
                          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{u.name} ({u.role})</span>
                        </div>
                      );
                    }

                    // Creator/Admin see checkboxes to toggle
                    return (
                      <label
                        key={u._id}
                        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer select-none ${
                          isRoomCreator ? "opacity-55 cursor-not-allowed" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || isRoomCreator}
                          disabled={isRoomCreator}
                          onChange={() => handleToggleManageMember(u._id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-700 block truncate">
                            {u.name} {isRoomCreator && <span className="text-[9px] text-amber-500 font-bold ml-1">(Creator)</span>}
                          </span>
                          <span className="text-[9px] text-slate-400 capitalize block leading-none">{u.role}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {/* Delete / Leave Actions */}
                <div className="flex items-center gap-2">
                  {(isCreatorOfActiveRoom || isAdmin) ? (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      title="Delete Group"
                    >
                      <FiTrash2 size={13} /> Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLeaveGroup}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
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
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                  {(isCreatorOfActiveRoom || isAdmin) && (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:shadow-blue-200 transition-all"
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
      {activeCall && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-xl aspect-video rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col relative text-white">
            
            {/* Call State: Connecting */}
            {callState === "connecting" && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                {activeChat === "group" || activeCustomRoom ? (
                  <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-black text-2xl text-slate-300 animate-pulse">
                    G
                  </div>
                ) : activeChatUser?.profile?.profileImage?.url ? (
                  <img
                    src={activeChatUser.profile.profileImage.url}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-600 animate-pulse shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-black text-2xl text-slate-300 animate-pulse shrink-0">
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
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black animate-pulse">Connecting call...</p>
                </div>
              </div>
            )}

            {/* Call State: Connected */}
            {callState === "connected" && (
              <div className="flex-1 flex flex-col md:flex-row relative bg-slate-950">
                {activeCall === "video" ? (
                  <div className="flex-1 grid grid-cols-2 gap-px h-full">
                    {/* User Feed */}
                    <div className="relative bg-slate-900 flex items-center justify-center border-r border-slate-800">
                      {isCamOff ? (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                          <FiVideoOff size={16} />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                          <FiUser size={36} className="opacity-20 animate-bounce" />
                          <span className="text-[9px] text-slate-400 absolute bottom-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded-md font-bold">You (Camera)</span>
                        </div>
                      )}
                    </div>
                    {/* Remote Feed */}
                    <div className="relative bg-slate-900 flex items-center justify-center">
                      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                        {activeChat === "group" || activeCustomRoom ? (
                          <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center font-black text-lg text-blue-400">
                            G
                          </div>
                        ) : activeChatUser?.profile?.profileImage?.url ? (
                          <img
                            src={activeChatUser.profile.profileImage.url}
                            alt="avatar"
                            className="w-16 h-16 rounded-full object-cover border border-blue-500 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center font-black text-lg text-blue-400 shrink-0">
                            {activeChatUser?.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 absolute bottom-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded-md font-bold">
                          {activeChat === "group" || activeCustomRoom ? "Team Feed" : activeChatUser?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <FiPhone className="text-blue-500 animate-bounce" size={24} />
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold">
                        {activeChat === "group"
                          ? "Group Voice Room"
                          : activeCustomRoom
                          ? activeCustomRoom.name
                          : activeChatUser?.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 tracking-wide font-black">
                        ONGOING CALL &bull; {formatDuration(callDuration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CALL CONTROLS DRAWER */}
            <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isMuted ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  {isMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
                </button>

                {activeCall === "video" && (
                  <button
                    onClick={() => setIsCamOff(!isCamOff)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isCamOff ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isCamOff ? <FiVideoOff size={14} /> : <FiCamera size={14} />}
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
                className="px-5 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/30 active:scale-95 transition-all"
              >
                End Call
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ChatPage;
