import { ReactNode, useState } from 'react';
import { GameExperienceOverlay } from './GameExperienceOverlay';
import { GameSidebar } from './GameSidebar';
import { GameTopBar } from './GameTopBar';

export function GameLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FFF7E8] text-[#49352A]">
      <GameSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <GameTopBar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <GameExperienceOverlay />
    </div>
  );
}
