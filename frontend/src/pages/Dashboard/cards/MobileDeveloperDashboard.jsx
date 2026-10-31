import React from 'react';
import GraphicDesignerDashboard from './GraphicDesignerDashboard';

const MobileDeveloperDashboard = ({ targetDept = "Mobile Developer", ...props }) => {
  return <GraphicDesignerDashboard targetDept={targetDept} {...props} />;
};

export default MobileDeveloperDashboard;
