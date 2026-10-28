import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * PublicLayout: Wraps /login only.
 * Clean public shell without authenticated navigation sidebars or scrutiny controls.
 */
export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
