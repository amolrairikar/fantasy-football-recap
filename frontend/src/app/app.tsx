import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from '@/components/header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import LeagueConnect from '@/features/connect_league/league-connect';
import Home from '@/features/home/home';
import { AppSidebar } from '@/features/sidebar/app-sidebar';
import Test from '@/features/test/test';
import LeagueQLLanding from '@/features/landing_page/landing-page';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Header /><LeagueQLLanding /></>} />
        <Route
          path="/connect_league"
          element={
            <>
              <Header />
              <div className="pt-1">
                <LeagueConnect />
              </div>
            </>
          }
        />
        <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/test" element={<AppLayout><Test /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
