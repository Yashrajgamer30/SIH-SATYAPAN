import React from 'react';
import { UserCheck, ShieldAlert, FileText, CheckCircle2, Clock } from 'lucide-react';

export interface TimelineEvent {
  id: string | number;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details?: string;
  type?: 'approval' | 'deficiency' | 'system' | 'upload';
}

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = "" }) => {
  return (
    <div className={`relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gov-border ${className}`}>
      {events.map((evt) => {
        const iconConfig = {
          approval: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-600' },
          deficiency: { icon: ShieldAlert, color: 'text-danger bg-danger-50 border-danger' },
          system: { icon: Clock, color: 'text-navy-700 bg-navy-50 border-navy-700' },
          upload: { icon: FileText, color: 'text-info bg-info-50 border-info' }
        }[evt.type || 'system'];

        const Icon = iconConfig.icon;

        return (
          <div key={evt.id} className="relative flex items-start gap-3">
            {/* Timeline Dot */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${iconConfig.color} shadow-xs`}>
              <Icon className="w-3 h-3" aria-hidden="true" />
            </div>

            {/* Event Content */}
            <div className="flex-1 bg-gov-surface border border-gov-border rounded-lg p-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-12 font-bold text-gov-text">
                    {evt.actor}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gov-subtle text-gov-muted border border-gov-border font-medium">
                    {evt.role}
                  </span>
                </div>
                <time className="text-11 text-gov-muted tabular-nums">
                  {evt.timestamp}
                </time>
              </div>

              <p className="text-12 font-semibold text-navy-700">
                {evt.action}
              </p>

              {evt.details && (
                <p className="text-12 text-gov-text bg-gov-subtle p-2 rounded border border-gov-border mt-2 font-mono text-[11px]">
                  {evt.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
