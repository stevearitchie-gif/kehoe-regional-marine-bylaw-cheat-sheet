
import type { BylawStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, Link } from 'lucide-react';

const statusConfig: Record<
  BylawStatus,
  {
    icon: React.ElementType;
    className: string;
    label: string;
  }
> = {
  Verified: {
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800/80',
    label: 'Verified',
  },
  'Needs review': {
    icon: AlertTriangle,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/80',
    label: 'Needs Review',
  },
  'Missing fields': {
    icon: Info,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800/80',
    label: 'Missing Fields',
  },
  'Needs source link': {
    icon: Link,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
    label: 'Needs Source Link',
  },
};

type StatusBadgeProps = {
  status: BylawStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge className={cn('gap-1.5 font-medium', config.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
