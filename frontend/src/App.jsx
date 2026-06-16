import React, { useState } from 'react';
import OverviewSales from './pages/OverviewSales';
import LeadsReport from './pages/LeadsReport';
import SimaoReport from './pages/SimaoReport';
import MetaAdsReport from './pages/MetaAdsReport';

function App() {
  const [activePage, setActivePage] = useState('overview');

  const navBtn = (page, label) => (
    <button
      onClick={() => setActivePage(page)}
      className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
        activePage === page
          ? 'bg-[#2A2115]/40 border border-[#817566] text-[#FFF3E3] shadow-lg'
          : 'bg-transparent border border-transparent text-text-secondary hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0F1010] min-h-screen text-text-primary">
      <div className="border-b border-[#24282F] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between select-none">
        <div className="hidden md:block w-28" />
        <div className="flex items-center justify-center gap-1 sm:gap-2 bg-[#14171B] border border-[#24282F] p-1 rounded-xl shadow-inner max-w-full overflow-x-auto scrollbar-none self-center">
          {navBtn('overview', 'Visão Geral')}
          {navBtn('leads', 'Leads')}
          {navBtn('simao', 'Diário')}
          {navBtn('meta', 'Meta Ads')}
        </div>
        <div className="flex items-center gap-2 w-28 justify-end">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-text-muted tracking-widest uppercase">Kommo Sync</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {activePage === 'overview' && <OverviewSales />}
        {activePage === 'leads' && <LeadsReport />}
        {activePage === 'simao' && <SimaoReport />}
        {activePage === 'meta' && <MetaAdsReport />}
      </div>
    </div>
  );
}

export default App;
