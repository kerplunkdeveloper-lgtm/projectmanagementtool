import React from 'react';
import GraphicDesignerDashboard from './GraphicDesignerDashboard';

const WebDeveloperDashboard = ({ targetDept = "Web Developer", ...props }) => {
  return <GraphicDesignerDashboard targetDept={targetDept} {...props} />;
};

export default WebDeveloperDashboard;
