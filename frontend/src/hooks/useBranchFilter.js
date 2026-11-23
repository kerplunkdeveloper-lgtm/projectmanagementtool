import { useCallback, useMemo, useState } from "react";

export const BRANCH_TABS = ["Pondicherry", "Chennai"];
const DEFAULT_BRANCH = "Pondicherry";
const STORAGE_KEY = "smBranchTab";

const normBranch = (b) => (b || "").trim().toLowerCase();

/**
 * Branch tab state shared by Content Calendar and SM Tasks (remembered across both pages).
 */
export const useBranchTab = () => {
  const [branchTab, setBranchTabState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return BRANCH_TABS.includes(saved) ? saved : DEFAULT_BRANCH;
    } catch {
      return DEFAULT_BRANCH;
    }
  });

  const setBranchTab = useCallback((tab) => {
    setBranchTabState(tab);
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch {
      /* ignore */
    }
  }, []);

  return [branchTab, setBranchTab];
};

/**
 * Returns helpers to filter clients / tasks by the selected branch.
 * Clients with no branch are treated as Pondicherry (the schema default).
 */
export const useBranchFilter = (clients, branchTab, enabled) => {
  const { idMap, nameMap } = useMemo(() => {
    const idMap = new Map();
    const nameMap = new Map();
    (clients || []).forEach((c) => {
      if (!c) return;
      const b = normBranch(c.branch) || "pondicherry";
      if (c._id) idMap.set(String(c._id), b);
      if (c.id) idMap.set(String(c.id), b);
      const name = (c.companyName || c.name || "").trim().toLowerCase();
      if (name) nameMap.set(name, b);
    });
    return { idMap, nameMap };
  }, [clients]);

  const active = enabled && branchTab && branchTab !== "All";
  const target = normBranch(branchTab);

  const isClientInBranch = useCallback(
    (c) => {
      if (!active) return true;
      return (normBranch(c?.branch) || "pondicherry") === target;
    },
    [active, target]
  );

  const isTaskInBranch = useCallback(
    (t) => {
      if (!active) return true;
      if (!t) return false;
      const cId = (t.client?._id || t.client)?.toString();
      let b = cId ? idMap.get(cId) : undefined;
      if (!b) {
        const cName = (t.clientName || t.client?.companyName || "").trim().toLowerCase();
        if (cName) b = nameMap.get(cName);
      }
      if (!b) b = normBranch(t.client?.branch) || "pondicherry";
      return b === target;
    },
    [active, target, idMap, nameMap]
  );

  return { isClientInBranch, isTaskInBranch, branchActive: active };
};

