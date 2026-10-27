import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = "" }) => {
  return (
    <nav aria-label="Breadcrumb" className={`py-2 px-1 text-12 text-gov-muted ${className}`}>
      <ol className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
        <li className="inline-flex items-center">
          <a
            href="#dashboard"
            className="inline-flex items-center text-gov-muted hover:text-navy-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </a>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-gov-muted mx-1 flex-shrink-0" aria-hidden="true" />
              {isLast ? (
                <span className="font-semibold text-gov-text" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  className="hover:text-navy-700 transition-colors"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
