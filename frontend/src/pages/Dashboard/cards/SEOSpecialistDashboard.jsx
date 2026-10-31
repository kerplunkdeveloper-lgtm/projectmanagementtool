import React from 'react';
import GraphicDesignerDashboard from './GraphicDesignerDashboard';

const SEOSpecialistDashboard = ({ targetDept = "SEO Specialist", ...props }) => {
  return <GraphicDesignerDashboard targetDept={targetDept} {...props} />;
};

export default SEOSpecialistDashboard;
