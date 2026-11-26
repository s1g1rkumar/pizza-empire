import {
  ArrowUpCircle,
  Boxes,
  Building2,
  Cog,
  DollarSign,
  Factory,
  LayoutDashboard,
  Map,
  Pizza,
  Settings,
  ShoppingBag,
  Sprout,
  Target,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const SIDEBAR_GROUPS = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Business Map', to: '/game/map', icon: Map },
    ],
  },
  {
    heading: 'Supply Chain',
    items: [
      { label: 'Farm', to: '/game/farm', icon: Sprout },
      { label: 'Inventory', to: '/game/inventory', icon: Boxes },
      { label: 'Factories', to: '/game/factories', icon: Factory },
      { label: 'Production', to: '/game/production', icon: Cog },
    ],
  },
  {
    heading: 'Storefronts',
    items: [
      { label: 'Restaurants', to: '/game/restaurants', icon: Pizza },
      { label: 'Chain HQ', to: '/game/chain', icon: Map },
      { label: 'Supermarkets', to: '/game/supermarkets', icon: ShoppingBag },
      { label: 'Malls', to: '/game/malls', icon: Building2 },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Employees', to: '/game/employees', icon: Users },
      { label: 'Delivery', to: '/game/delivery', icon: Truck },
      { label: 'Finance', to: '/game/finance', icon: DollarSign },
    ],
  },
  {
    heading: 'Growth & System',
    items: [
      { label: 'Upgrades', to: '/game/upgrades', icon: ArrowUpCircle },
      { label: 'Missions', to: '/game/missions', icon: Target },
      { label: 'Settings', to: '/profile', icon: Settings },
    ],
  },
] as const;

interface GameSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function GameSidebar({ mobileOpen, onCloseMobile }: GameSidebarProps) {
  const navContent = (
    <div className="flex h-full flex-col bg-[#49352A] text-[#FFF7E8] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#FFF7E8]/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E94B35] to-[#F28C38] text-white shadow-md">
            <Pizza className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-[#FFF7E8]">Pizza Empire</p>
            <p className="text-[10px] font-extrabold tracking-widest text-[#FFC857]">TYCOON</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-[#FFF7E8]/70 hover:bg-[#FFF7E8]/10 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Game navigation">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-3 text-[10px] font-extrabold tracking-widest text-[#FFC857]/70 uppercase">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#E94B35] text-white shadow-sm'
                        : 'text-[#FFF7E8]/80 hover:bg-[#FFF7E8]/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#FFF7E8]/10 px-4 py-3 text-[11px] font-medium text-[#FFF7E8]/60">
        <div className="flex items-center gap-2">
          <Cog className="h-3.5 w-3.5 text-[#FFC857]" />
          <span>v1.0 Tycoon Engine</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">{navContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onCloseMobile} />
          <aside className="relative z-10 w-64">{navContent}</aside>
        </div>
      )}
    </>
  );
}
