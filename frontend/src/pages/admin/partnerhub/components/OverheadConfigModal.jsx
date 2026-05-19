import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../services/axiosInstance';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OverheadConfigModal = ({ isOpen, onClose, currentOverheads, onUpdate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      // deep copy
      setItems(currentOverheads.map(o => ({ ...o })));
      setNewItemName('');
      setNewItemAmount('');
    }
  }, [isOpen, currentOverheads]);

  const handleAmountChange = (index, val) => {
    const updated = [...items];
    updated[index].amount = val;
    setItems(updated);
  };

  const handleRemove = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleAdd = () => {
    if (!newItemName || !newItemAmount) return;
    setItems([...items, { name: newItemName, amount: Number(newItemAmount) }]);
    setNewItemName('');
    setNewItemAmount('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/overheads/bulk', { overheads: items });
      toast.success("Overheads updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update overheads");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#cbd0e1] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-in-center">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#cbd0e1] border-b border-[#a7adcb]">
          <h2 className="text-[#1a2035] text-lg font-extrabold flex items-center gap-2">
            <span>🏢</span> Configure Overhead Expenses
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#cbd0e1] flex-1 overflow-y-auto">
          <p className="text-[#64748b] text-xs font-medium mb-5">
            These monthly fixed costs are deducted from revenue to calculate net profit.
          </p>
          
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-[#f1f3f9] p-3 rounded-xl border border-white shadow-inner">
                <span className="text-[#1e293b] font-bold text-sm flex-1">{item.name}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleAmountChange(index, e.target.value)}
                    className="w-28 bg-white border border-slate-200 text-[#1e293b] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-sm text-right shadow-sm"
                  />
                  <button 
                    onClick={() => handleRemove(index)}
                    className="text-red-500 hover:text-red-600 transition-colors px-1"
                  >
                    <FiX size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <input
              type="text"
              placeholder="Expense name (e.g. Office Rent)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm shadow-inner placeholder:text-slate-400"
            />
            <input
              type="number"
              placeholder="Amount ₹"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-full sm:w-32 bg-[#f1f3f9] border border-white text-[#1e293b] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm shadow-inner placeholder:text-slate-400"
            />
            <button
              onClick={handleAdd}
              disabled={!newItemName || !newItemAmount}
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#475569] font-bold text-sm rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-[#cbd0e1] border-t border-[#a7adcb]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#f1f3f9] text-[#475569] font-bold hover:bg-white transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#7c5ff0] text-white font-bold hover:bg-[#6c4be0] disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/30"
          >
            {loading ? 'Saving...' : 'Save Overhead'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default OverheadConfigModal;
