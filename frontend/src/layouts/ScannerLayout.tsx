import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * ScannerLayout: ONLY for the scan route
 * /official/applications/:appId/students/:studentId/documents/:docId/scan
 *
 * Strict Layout Contract:
 * - Separate route, NOT an overlay
 * - Renders neither the Officials header nor the sidebar
 * - Root element: position fixed, inset 0, solid opaque background (var(--bg-forensic)),
 *   isolation isolate, grid rows [56px 1fr], overflow hidden.
 */
export const ScannerLayout: React.FC = () => {
  return (
    <div
      id="satyapan-scanner-layout"
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-forensic)',
        isolation: 'isolate',
        display: 'grid',
        gridTemplateRows: '56px 1fr'
      }}
    >
      <Outlet />
    </div>
  );
};

export default ScannerLayout;
