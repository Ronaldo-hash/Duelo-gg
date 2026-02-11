import React, { useState, useEffect } from 'react';
import { AppProvider, useAppStore } from './hooks/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Loader } from './components/shared/Loader';
import { ScannerModal } from './components/shared/ScannerModal';
import { Arena } from './components/views/Arena';
import { Matches } from './components/views/Matches';
import { Bank } from './components/views/Bank';
import { Profile } from './components/views/Profile';
import { Admin } from './components/views/Admin';
import { DevTools } from './components/views/DevTools';
import { Lobby } from './components/views/Lobby'; // Import Lobby
import { ClanPage } from './components/views/ClanPage'; // Import Clan
import { NotificationToast } from './components/shared/NotificationToast';
import { Auth } from './components/views/Auth';

const DueloggApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'arena' | 'matches' | 'bank' | 'profile' | 'dev' | 'admin' | 'lobby' | 'clan'>('arena');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeScannerMatchId, setActiveScannerMatchId] = useState<number | null>(null);
  const [selectedLobbyId, setSelectedLobbyId] = useState<number | null>(null); // State for Lobby

  const { balance, user, removeMatch, addToBalance, addHistoryItem, setEscrow, activeMatches, showNotification } = useAppStore();

  // If no user, show Auth screen
  if (!user) {
    return <Auth onLogin={() => { }} />;
  }

  const handleNavigateToLobby = (matchId: number) => {
    setSelectedLobbyId(matchId);
    setActiveTab('lobby');
  };

  const handleConfirmVictory = () => {
    if (!activeScannerMatchId) return;
    setIsProcessing(true);
    setShowScanner(false);

    setTimeout(() => {
      const match = activeMatches.find(m => m.id === activeScannerMatchId);
      if (match) {
        setEscrow(prev => prev - match.stake);
        addToBalance(match.reward);
        addHistoryItem({ id: Date.now(), type: 'DUELO_WIN', amount: match.reward, date: 'Hoje', status: 'CONFIRMADO' });
        removeMatch(activeScannerMatchId);
        showNotification("IA validou seu print! R$ " + match.reward.toFixed(2) + " creditados.", "success");
      }
      setIsProcessing(false);
      setActiveScannerMatchId(null);
    }, 2500);
  };

  const openScanner = (matchId: number) => {
    setActiveScannerMatchId(matchId);
    setShowScanner(true);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 flex flex-col pb-24 lg:pb-0 lg:pl-72 bg-cover bg-center bg-fixed relative" style={{ backgroundImage: "url('/cyberpunk_bg.png')" }} >
      {/* Overlay to darken background for readability */}
      <div className="absolute inset-0 bg-[#0F1523]/90 z-0 fixed"></div>

      {/* Content wrapper to ensure z-index above overlay */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        {/* Note: Sidebar has fixed positioning, so it stays on top. But responsive behavior needs care. */}

        {/* Balance Display - Top Right */}

        <main className="flex-1 p-6 lg:p-12 max-w-5xl mx-auto w-full">
          {activeTab === 'arena' && <Arena setLoading={setIsProcessing} onNavigate={setActiveTab} onSelectMatch={handleNavigateToLobby} />}
          {activeTab === 'matches' && <Matches onRequestCamera={openScanner} onSelectMatch={handleNavigateToLobby} />}
          {activeTab === 'bank' && <Bank />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'clan' && <ClanPage />}
          {activeTab === 'dev' && <DevTools setLoading={setIsProcessing} />}
          {activeTab === 'admin' && <Admin />}
          {activeTab === 'lobby' && <Lobby matchId={selectedLobbyId} onBack={() => setActiveTab('arena')} />}
        </main>

        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {isProcessing && <Loader />}

        {showScanner && (
          <ScannerModal
            onConfirm={handleConfirmVictory}
            onCancel={() => setShowScanner(false)}
          />
        )}

        <style>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
            @keyframes scan-line { 0% { transform: translateY(-60px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(60px); opacity: 0; } }
            .animate-scan-line { animation: scan-line 2s infinite ease-in-out; }
            `}</style>
      </div>
    </div>
  );
};

// Re-add ErrorBoundary in App wrapper
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const App: React.FC = () => (
  <AppProvider>
    <NotificationToast />
    <ErrorBoundary>
      <DueloggApp />
    </ErrorBoundary>
  </AppProvider>
);

export default App;
