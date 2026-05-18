import React, { useState } from "react";
import OverheadConfigModal from "./OverheadConfigModal";

const formatINR = (amount) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

const OverheadConfig = ({ overheads, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalOverhead = overheads.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6 h-full flex flex-col shadow-sm animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#1e293b] font-extrabold text-base flex items-center gap-2">
          <span>🏢</span> Overhead Configuration
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-1.5 bg-white border border-slate-200 text-[#475569] font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
      </div>

      {/* List */}
      <div className="flex-1 space-y-4">
        {overheads.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4 font-medium">No overheads configured.</p>
        ) : (
          overheads.map((item, idx) => (
            <div key={item._id || idx} className="flex justify-between items-center group">
              <span className="text-[#475569] text-[13px] font-medium">{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[#f59e0b] font-bold text-sm">{formatINR(item.amount)}</span>
                <span className="text-slate-300 group-hover:text-slate-400 cursor-default text-sm">×</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Total */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[#1e293b] font-black text-sm">Total</span>
          <span className="text-[#ef4444] font-black text-base">{formatINR(totalOverhead)}</span>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2.5 bg-white border border-slate-200 text-[#475569] font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          + Edit Overhead
        </button>
      </div>

      <OverheadConfigModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentOverheads={overheads}
        onUpdate={onUpdate}
      />

    </div>
  );
};

export default OverheadConfig;
