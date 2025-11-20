import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center text-sm">
              {index > 0 && (
                <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
              )}
              <div
                className={`ml-2 ${
                  index === items.length - 1
                    ? 'font-bold text-2xl text-text-main' // Last item is the page title
                    : 'font-medium text-text-muted hover:text-text-main'
                }`}
              >
                {index === items.length - 1 || !item.path ? (
                  <span>{item.label}</span>
                ) : (
                  <Link to={item.path}>{item.label}</Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
