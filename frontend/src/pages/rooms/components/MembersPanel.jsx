import { useState } from "react";
import { toast } from "react-hot-toast";
import { FiUserX, FiStar } from "react-icons/fi";
import { Avatar, ConfirmDialog } from "./RoomUI";
import { removeMember, apiError } from "../../../services/roomService";

const MembersPanel = ({ room, currentUserId, onChanged }) => {
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const max = room.limits?.maxMembers;

  const doRemove = async () => {
    setBusy(true);
    try {
      await removeMember(room._id, target._id);
      toast.success(`${target.name} was removed`);
      setTarget(null);
      onChanged?.();
    } catch (err) {
      toast.error(apiError(err, "Could not remove member"));
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...room.members].sort((a, b) => (a.role === "host" ? -1 : b.role === "host" ? 1 : 0));

  return (
    <section className="room-card p-4" aria-labelledby="members-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="members-heading" className="text-sm font-bold text-slate-800 dark:text-white">Members</h2>
        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
          {room.members.length}{max ? ` / ${max}` : ""}
        </span>
      </div>
      <ul className="space-y-1">
        {sorted.map((m) => {
          const isMe = m._id?.toString() === currentUserId;
          return (
            <li key={m._id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <Avatar user={m} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {m.name}
                  {isMe && <span className="text-slate-400 font-medium"> (you)</span>}
                </p>
                {m.department && <p className="text-[11px] text-slate-400 truncate">{m.department}</p>}
              </div>
              {m.role === "host" ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wide">
                  <FiStar size={10} aria-hidden="true" /> Host
                </span>
              ) : (
                room.isHost && (
                  <button
                    type="button"
                    className="room-btn-ghost hover:!text-rose-600"
                    onClick={() => setTarget(m)}
                    aria-label={`Remove ${m.name} from room`}
                    title="Remove member"
                  >
                    <FiUserX size={15} />
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(target)}
        title={`Remove ${target?.name}?`}
        message="They'll lose access to this room's files and notes right away, and won't be able to rejoin, even with a new code."
        confirmLabel="Remove member"
        danger
        busy={busy}
        onConfirm={doRemove}
        onCancel={() => setTarget(null)}
      />
    </section>
  );
};

export default MembersPanel;
