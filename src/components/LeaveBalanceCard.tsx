import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaveBalanceCardProps {
  userId: string;
}

// Simple leave balance based on leave_requests table
interface LeaveStats {
  annual_used: number;
  sick_used: number;
  other_used: number;
  annual_quota: number;
}

export function LeaveBalanceCard({ userId }: LeaveBalanceCardProps) {
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveStats();
  }, [userId]);

  const fetchLeaveStats = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;
      
      // Get approved leave requests for this year
      const { data, error } = await supabase
        .from('leave_requests')
        .select('leave_type, total_days')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .gte('start_date', startOfYear)
        .lte('end_date', endOfYear);

      if (error) throw error;

      // Calculate totals
      const annual = data?.filter(l => l.leave_type === 'annual').reduce((sum, l) => sum + l.total_days, 0) || 0;
      const sick = data?.filter(l => l.leave_type === 'sick').reduce((sum, l) => sum + l.total_days, 0) || 0;
      const other = data?.filter(l => !['annual', 'sick'].includes(l.leave_type)).reduce((sum, l) => sum + l.total_days, 0) || 0;

      setStats({
        annual_used: annual,
        sick_used: sick,
        other_used: other,
        annual_quota: 12, // Default annual quota
      });
    } catch (error) {
      console.error('Error fetching leave stats:', error);
      setStats({
        annual_used: 0,
        sick_used: 0,
        other_used: 0,
        annual_quota: 12,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const annual_remaining = stats.annual_quota - stats.annual_used;
  const usagePercentage = (stats.annual_used / stats.annual_quota) * 100;
  const isLowBalance = annual_remaining <= 3;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Saldo Cuti</CardTitle>
          </div>
          {isLowBalance && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Sisa Sedikit
            </Badge>
          )}
        </div>
        <CardDescription>Tahun {new Date().getFullYear()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Annual Leave */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cuti Tahunan</span>
            <span className="font-semibold">
              {annual_remaining} / {stats.annual_quota} hari
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Terpakai: {stats.annual_used} hari</span>
            <span>{Math.round(usagePercentage)}%</span>
          </div>
        </div>

        {/* Sick Leave */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sakit</p>
              <p className="text-lg font-semibold">{stats.sick_used} hari</p>
            </div>
            <div>
              <p className="text-muted-foreground">Izin Lainnya</p>
              <p className="text-lg font-semibold">{stats.other_used} hari</p>
            </div>
          </div>
        </div>

        {isLowBalance && (
          <div className="pt-3 border-t">
            <p className="text-xs text-destructive">
              ⚠️ Saldo cuti tahunan Anda tinggal {annual_remaining} hari
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
