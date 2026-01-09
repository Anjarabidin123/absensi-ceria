import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  iconClassName?: string;
}

interface SimpleNotification {
  id: string;
  type: 'leave' | 'overtime' | 'approval';
  message: string;
  created_at: string;
  link: string;
}

export function NotificationBell({ iconClassName }: NotificationBellProps) {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.id && (activeRole === 'admin_hr' || activeRole === 'manager')) {
      fetchPendingApprovals();
    }
  }, [user?.id, activeRole]);

  const fetchPendingApprovals = async () => {
    try {
      // Fetch pending leave requests
      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('id, created_at, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch pending overtime requests
      const { data: overtimeData } = await supabase
        .from('overtime_requests')
        .select('id, created_at, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      const notifs: SimpleNotification[] = [];

      leaveData?.forEach(l => {
        notifs.push({
          id: `leave-${l.id}`,
          type: 'leave',
          message: 'Pengajuan cuti menunggu persetujuan',
          created_at: l.created_at,
          link: '/approvals'
        });
      });

      overtimeData?.forEach(o => {
        notifs.push({
          id: `overtime-${o.id}`,
          type: 'overtime',
          message: 'Pengajuan lembur menunggu persetujuan',
          created_at: o.created_at,
          link: '/approvals'
        });
      });

      // Sort by date
      notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(notifs.slice(0, 10));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = (notif: SimpleNotification) => {
    navigate(notif.link);
    setOpen(false);
  };

  const unreadCount = notifications.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={iconClassName || "h-5 w-5"} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} baru
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem 
              key={notif.id}
              className="flex flex-col items-start gap-1 cursor-pointer p-3"
              onClick={() => handleNotificationClick(notif)}
            >
              <span className="text-sm font-medium">{notif.message}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(notif.created_at), 'dd MMM, HH:mm', { locale: id })}
              </span>
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-sm text-primary cursor-pointer"
              onClick={() => { navigate('/approvals'); setOpen(false); }}
            >
              Lihat Semua
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
