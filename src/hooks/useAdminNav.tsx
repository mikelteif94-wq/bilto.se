import { LayoutDashboard, Building2, Users, BookOpen, CalendarDays } from 'lucide-react';
import { useAdminBadges } from './useAdminBadges';

export type AdminPage = 'overview' | 'leads' | 'handlare' | 'katalog' | 'bokningar';

interface AdminNavOptions {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
}

export function useAdminNav({ activePage, onNavigate }: AdminNavOptions) {
  const badges = useAdminBadges();

  return [
    {
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      label: 'Översikt',
      active: activePage === 'overview',
      onClick: activePage !== 'overview' ? () => onNavigate('overview') : undefined,
    },
    {
      icon: <Users className="w-[18px] h-[18px]" />,
      label: 'Leads',
      active: activePage === 'leads',
      badge: badges.totalLeads,
      onClick: activePage !== 'leads' ? () => onNavigate('leads') : undefined,
    },
    {
      icon: <Building2 className="w-[18px] h-[18px]" />,
      label: 'Handlare',
      active: activePage === 'handlare',
      badge: badges.pendingDealers,
      onClick: activePage !== 'handlare' ? () => onNavigate('handlare') : undefined,
    },
    {
      icon: <BookOpen className="w-[18px] h-[18px]" />,
      label: 'Katalog',
      active: activePage === 'katalog',
      onClick: activePage !== 'katalog' ? () => onNavigate('katalog') : undefined,
    },
    {
      icon: <CalendarDays className="w-[18px] h-[18px]" />,
      label: 'Bokningar',
      active: activePage === 'bokningar',
      onClick: activePage !== 'bokningar' ? () => onNavigate('bokningar') : undefined,
    },
  ];
}
