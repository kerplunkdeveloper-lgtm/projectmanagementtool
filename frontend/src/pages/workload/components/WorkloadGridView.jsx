import React from "react";
import WorkloadCard from "./WorkloadCard.jsx";

// ==========================================
// WORKLOAD GRID VIEW COMPONENT (MULTI-ROW)
// ==========================================
const WorkloadGridView = React.memo(({
  workloads = [],
  expandedUserIds,
  onToggleExpand,
  onViewTask,
  selectedDepartment,
}) => {
  if (!workloads || workloads.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
      {workloads.map((workload, idx) => (
        <WorkloadCard
          key={workload.user._id}
          workload={workload}
          isExpanded={expandedUserIds?.has(workload.user._id)}
          onToggleExpand={onToggleExpand}
          onViewTask={onViewTask}
          selectedDepartment={selectedDepartment}
          cardIndex={idx + 1}
        />
      ))}
    </div>
  );
});

export default WorkloadGridView;
