import { Badge } from '@/components/ui/badge';
import type { BillStatus } from '@/types';

const statusConfig: Record<BillStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Paid', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  unpaid: { label: 'Unpaid', variant: 'destructive' },
};

interface StatusBadgeProps {
  status: BillStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={
      status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' :
      status === 'partial' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' :
      'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    }>
      {config.label}
    </Badge>
  );
}
