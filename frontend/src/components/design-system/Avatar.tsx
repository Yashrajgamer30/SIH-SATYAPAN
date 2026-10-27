import React from 'react';

export interface AvatarProps {
  name: string;
  role?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'busy' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  role,
  src,
  size = 'md',
  status,
  className = ""
}) => {
  // Extract initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const sizeStyles = {
    sm: 'w-7 h-7 text-11',
    md: 'w-9 h-9 text-12',
    lg: 'w-12 h-12 text-14 font-bold'
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-navy-700 text-white font-bold select-none border-2 border-gov-surface shadow-xs ${sizeStyles} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-gov-surface ${
            status === 'online' ? 'bg-green-600' : status === 'busy' ? 'bg-danger' : 'bg-gov-muted'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
