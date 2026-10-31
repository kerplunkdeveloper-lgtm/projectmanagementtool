import React from 'react';
import GraphicDesignerDashboard from './GraphicDesignerDashboard';

const PerformanceMarketerDashboard = ({ targetDept = "Performance Marketer", ...props }) => {
  return <GraphicDesignerDashboard targetDept={targetDept} {...props} />;
};

export default PerformanceMarketerDashboard;
