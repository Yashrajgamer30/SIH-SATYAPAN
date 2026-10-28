import React from 'react';
import { EmptyState } from '../components/design-system/EmptyState';
import { FileSearch } from 'lucide-react';

interface PlaceholderPageViewProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const PlaceholderPageView: React.FC<PlaceholderPageViewProps> = ({
  title = "Module In Progress",
  description = "This regulatory section is active in the SATYAPAN production environment. Data synchronisation in progress.",
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="py-8">
      <EmptyState
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={onAction}
        icon={icon || <FileSearch className="w-8 h-8 text-navy-700 dark:text-saffron-400 stroke-[1.5]" />}
      />
    </div>
  );
};

export default PlaceholderPageView;
