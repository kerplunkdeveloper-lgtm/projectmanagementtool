import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

const DeleteUserModal = ({ open, setOpen, onConfirm, user }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1B2A] p-6 md:p-8 shadow-2xl scale-in-center">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
            <FiAlertTriangle size={24} />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Deletion</h2>
          <p className="text-gray-400">
            Are you sure you want to delete <span className="text-cyan-400 font-semibold">{user?.name}</span>? 
            This action cannot be undone and all associated data will be removed.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setOpen(false)}
            className="h-12 rounded-2xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/20 transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
