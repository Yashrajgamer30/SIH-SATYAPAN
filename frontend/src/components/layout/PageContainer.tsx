import React from 'react';
import { Breadcrumb, BreadcrumbItem } from '../design-system/Breadcrumb';

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className = ""
}) => {
  return (
    <div className={`w-full max-w-[1440px] mx-auto p-6 ${className}`}>
      {/* Optional Breadcrumb Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      {/* Page Title Row */}
      {(title || actions) && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-navy-700/80">
          <div>
            {title && (
              <h1 className="text-22 sm:text-24 font-bold text-gov-text tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-13 sm:text-14 text-gov-muted mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Main Page Content */}
      {children}
    </div>
  );
};
