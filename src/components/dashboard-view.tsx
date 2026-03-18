
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Bylaw } from '@/lib/types';
import { Building, Map, CheckCircle, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export function DashboardView({ records }: { records: Bylaw[] }) {
  const totalMunicipalities = records.length;
  const totalRegions = new Set(records.map((r) => r.region)).size;
  const verifiedRecords = records.filter((r) => r.status === 'Verified').length;
  const needsAttention = totalMunicipalities - verifiedRecords;

  return (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Municipalities" value={totalMunicipalities} icon={Building} color="text-primary" />
            <StatCard title="Total Regions" value={totalRegions} icon={Map} color="text-primary" />
            <StatCard title="Verified Records" value={verifiedRecords} icon={CheckCircle} color="text-green-600" />
            <StatCard title="Records Needing Attention" value={needsAttention} icon={AlertTriangle} color="text-yellow-600" />
        </div>
    </div>
  );
}
