import React, { useState } from "react";
import { FiExternalLink } from "react-icons/fi";

const formatINR = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const ProfitPerClientTable = ({ clients }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? clients : clients.slice(0, 8);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col h-full shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-[#1e293b] font-extrabold text-base">
            Profit per Client{" "}
            <span className="text-[#94a3b8] text-[11px] font-bold uppercase tracking-wider">(This Month)</span>
          </h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#64748b] hover:text-[#0f172a] text-xs font-bold flex items-center gap-1 transition-colors"
        >
          {expanded ? "Collapse" : "Full Breakdown"}
          <FiExternalLink size={11} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-[#94a3b8] font-bold text-[10px] uppercase tracking-wider text-left pb-3 pr-4 pl-4 pt-3 rounded-tl-xl">
                Client
              </th>
              <th className="text-[#94a3b8] font-bold text-[10px] uppercase tracking-wider text-right pb-3 pr-4 pt-3">
                Revenue
              </th>
              <th className="text-[#94a3b8] font-bold text-[10px] uppercase tracking-wider text-right pb-3 pr-4 pt-3">
                Profit
              </th>
              <th className="text-[#94a3b8] font-bold text-[10px] uppercase tracking-wider text-right pb-3 pr-4 pt-3 rounded-tr-xl">
                Margin
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((client, i) => {
              const marginColor =
                client.margin >= 50
                  ? "#34d399"
                  : client.margin >= 35
                  ? "#facc15"
                  : "#fb923c";
              return (
                <tr
                  key={i}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2 pr-4 pl-4">
                    <span className="text-[#1e293b] font-bold text-[13px]">
                      {client.name}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right text-[#64748b] font-semibold text-[13px]">
                    {formatINR(client.revenue)}
                  </td>
                  <td className="py-2 pr-4 text-right font-bold text-[#10b981] text-[13px]">
                    {formatINR(client.profit)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: `${marginColor}18`,
                        color: marginColor,
                      }}
                    >
                      {client.margin}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!expanded && clients.length > 8 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 pt-3 border-t border-slate-100 text-[#7c5ff0] hover:text-[#6c4be0] text-xs font-bold text-center transition-colors w-full"
        >
          + Show {clients.length - 8} more clients
        </button>
      )}
    </div>
  );
};

export default ProfitPerClientTable;
