import {
  LayoutDashboard,
  Car as CarIcon,
  Building2,
  Search,
  ArrowLeftRight,
  TrendingDown,
  CarFront,
} from 'lucide-react';
import { useAdminBadges } from './useAdminBadges';

export type AdminPage =
  | 'overview'
  | 'hittat-bil'
  | 'letar-bil'
  | 'inbyte'
  | 'salj'
  | 'bilar'
  | 'handlare';

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
      icon: <CarFront className="w-[18px] h-[18px]" />,
      label: 'Hittat bil',
      active: activePage === 'hittat-bil',
      badge: badges.hittatBil,
      onClick: activePage !== 'hittat-bil' ? () => onNavigate('hittat-bil') : undefined,
    },
    {
      icon: <Search className="w-[18px] h-[18px]" />,
      label: 'Letar bil',
      active: activePage === 'letar-bil',
      badge: badges.letarBil,
      onClick: activePage !== 'letar-bil' ? () => onNavigate('letar-bil') : undefined,
    },
    {
      icon: <ArrowLeftRight className="w-[18px] h-[18px]" />,
      label: 'Inbyte',
      active: activePage === 'inbyte',
      badge: badges.inbyte,
      onClick: activePage !== 'inbyte' ? () => onNavigate('inbyte') : undefined,
    },
    {
      icon: <TrendingDown className="w-[18px] h-[18px]" />,
      label: 'Sälj',
      active: activePage === 'salj',
      badge: badges.salj,
      onClick: activePage !== 'salj' ? () => onNavigate('salj') : undefined,
    },
    {
      icon: <CarIcon className="w-[18px] h-[18px]" />,
      label: 'Bilar',
      active: activePage === 'bilar',
      badge: badges.newCars,
      onClick: activePage !== 'bilar' ? () => onNavigate('bilar') : undefined,
    },
    {
      icon: <Building2 className="w-[18px] h-[18px]" />,
      label: 'Handlare',
      active: activePage === 'handlare',
      badge: badges.pendingDealers,
      onClick: activePage !== 'handlare' ? () => onNavigate('handlare') : undefined,
    },
  ];
}
