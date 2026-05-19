import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-in-center">
        
        <div className="p-4 flex flex-col items-center text-center">
          <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
            <FiAlertTriangle size={22} />
          </div>
          
          <h2 className="text-base font-bold text-slate-800 mb-1.5">Delete Project?</h2>
          <p className="text-slate-500 text-sm mb-6">
            Are you sure you want to delete <span className="font-semibold text-slate-700">{itemName}</span>? This action cannot be undone and all associated data will be permanently removed.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-md shadow-red-500/20 transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
