import React, { useState, useEffect } from 'react';
import { getMetaAdsMetrics } from '../services/api';
import { Calendar, DollarSign, TrendingUp, MousePointerClick, Megaphone, Eye, Activity, CheckCircle, PauseCircle, AlertTriangle } from 'lucide-react';

const getDefaultDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { startDate: fmt(new Date(year, month, 1)), endDate: fmt(new Date(year, month + 1, 0)) };
};

const MetaAdsReport = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMetaAdsMetrics(dateRange).then(data => {
      setMetrics(data);
      setShowError(!!data?.error);
    }).catch(() => setShowError(true)).finally(() => setLoading(false));
  }, [dateRange]);

  const fmt$ = val => `R$ ${Math.round(val||0).toLocaleString('pt-BR')}`;
  const fmt$c = val => `R$ ${(val||0).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtN = val => Math.round(val||0).toLocaleString('pt-BR');
  const fmtPct = val => `${((val||0)*100).toFixed(2).replace('.',',')}%`;
  const fmtX = val => `${(val||0).toFixed(2).replace('.',',')}x`;

  if (loading) return (
    <div className="w-full min-h-screen bg-[#0B0B0C] p-6 animate-pulse flex flex-col gap-6">
      <div className="h-12 bg-bg-secondary border border-border-card rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">{[...Array(7)].map((_,i) => <div key={i} className="h-24 bg-[#14171B] rounded-2xl" />)}</div>
      <div className="h-96 bg-[#14171B] rounded-2xl" />
    </div>
  );

  const summary = metrics?.summary || {};
  const campaigns = (metrics?.campaigns || []).filter(c => (c.spend||0) > 0);

  const quickFilters = [
    { label: 'Hoje', val: 0 }, { label: '7D', val: 7 }, { label: '15D', val: 15 }, { label: 'Mês', val: 30 },
  ];

  return (
    <div className="w-full flex flex-col gap-6 select-none p-6 bg-[#0B0B0C] min-h-screen text-text-primary">
      {showError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#14171B] border border-red-950 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-950/45 border border-red-900/40 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Erro na API da Meta</h3>
            <p className="text-[11px] text-text-secondary">Erro de comunicação com a API da Meta. Por favor, verifique o token e a conta de anúncios.</p>
            <button onClick={() => setShowError(false)} className="w-full py-2 bg-red-950/20 hover:bg-red-950/55 border border-red-900/30 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest cursor-pointer">
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-border-card">
        <div className="flex flex-col text-left">
          <h2 className="text-xl font-bold tracking-widest text-text-secondary uppercase">Performance de Campanhas (Meta Ads)</h2>
          <span className="text-[10px] text-text-muted font-medium tracking-wider mt-0.5">Métricas de anúncios cruzadas com conversões no CRM</span>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-1 bg-bg-secondary border border-border-card p-1 rounded-xl shadow-inner">
            {quickFilters.map(item => {
              const today = new Date();
              let start = new Date(today);
              if (item.val > 0) start.setDate(today.getDate() - (item.val - 1));
              const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              const s = fmt(start), e = fmt(today);
              const isActive = dateRange.startDate === s && dateRange.endDate === e;
              return (
                <button key={item.label} onClick={() => setDateRange({ startDate: s, endDate: e })}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${isActive ? 'bg-[#2A2115]/50 border border-gold-primary text-[#FFF3E3]' : 'bg-transparent border border-transparent text-text-secondary hover:text-white'}`}>
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 bg-bg-secondary border border-border-card rounded-xl px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-md">
            <Calendar className="w-4 h-4 text-gold-primary" />
            <input type="date" value={dateRange.startDate} onChange={e => setDateRange(d => ({...d, startDate: e.target.value}))} className="bg-transparent text-white border-none outline-none cursor-pointer [color-scheme:dark]" />
            <span className="text-text-muted">até</span>
            <input type="date" value={dateRange.endDate} onChange={e => setDateRange(d => ({...d, endDate: e.target.value}))} className="bg-transparent text-white border-none outline-none cursor-pointer [color-scheme:dark]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Investimento', val: fmt$(summary.totalSpend), sub: 'Verba total consumida', Icon: DollarSign, color: 'text-gold-primary' },
          { label: 'Impressões', val: fmtN(summary.totalImpressions), sub: 'Visualizações dos anúncios', Icon: Eye, color: 'text-blue-400' },
          { label: 'Cliques', val: fmtN(summary.totalClicks), sub: `CTR: ${fmtPct(summary.avgCtr)}`, Icon: MousePointerClick, color: 'text-gold-primary' },
          { label: 'CPC Médio', val: fmt$c(summary.avgCpc), sub: 'Custo por clique', Icon: Activity, color: 'text-text-muted' },
          { label: 'Leads Gerados', val: fmtN(summary.totalLeads), sub: 'Leads via formulários', Icon: Megaphone, color: 'text-gold-primary' },
          { label: 'CPL', val: fmt$c(summary.avgCpl), sub: 'Custo por lead', Icon: Activity, color: 'text-rose-400' },
          { label: 'ROAS CRM', val: fmtX(summary.overallRoas || summary.avgRoas || 0), sub: `VGV: ${fmt$(summary.totalVgv)}`, Icon: TrendingUp, color: 'text-emerald-400', gold: true },
        ].map(({ label, val, sub, Icon, color, gold }) => (
          <div key={label} className={`${gold ? 'bg-[#2A2115]/20 border-[#817566]/40' : 'bg-[#14171B] border-border-card'} border rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-gold-primary transition-colors text-left`}>
            <div>
              <span className={`text-[8px] font-black ${gold ? 'text-gold-primary' : 'text-text-muted'} tracking-widest uppercase block`}>{label}</span>
              <span className={`text-lg font-black ${gold ? 'text-gold-hover' : 'text-white'} mt-1 block mono-numbers`}>{val}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Icon className={`w-3.5 h-3.5 ${color} opacity-60`} />
              <span className="text-[8px] text-text-secondary font-bold">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg">
        <div className="text-left mb-4">
          <h3 className="text-xs font-black tracking-wider text-white uppercase">Detalhamento das Campanhas</h3>
          <span className="text-[9px] text-text-muted">Métricas ponta a ponta: do anúncio ao VGV gerado no CRM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border-card text-text-muted uppercase tracking-widest font-black text-[8px]">
                <th className="py-3 px-2">Campanha</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-right">Gasto</th>
                <th className="py-3 px-2 text-right">Impressões</th>
                <th className="py-3 px-2 text-right">Leads</th>
                <th className="py-3 px-2 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D2127]">
              {campaigns.length > 0 ? campaigns.map(camp => (
                <tr key={camp.id} className="hover:bg-[#1E232A]/40 transition-colors">
                  <td className="py-3.5 px-2 font-bold text-white max-w-[180px] truncate" title={camp.name}>{camp.name}</td>
                  <td className="py-3.5 px-2 text-center">
                    {camp.status === 'ACTIVE'
                      ? <span className="flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[7.5px] uppercase"><CheckCircle className="w-2.5 h-2.5" /> Ativa</span>
                      : <span className="flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[7.5px] uppercase"><PauseCircle className="w-2.5 h-2.5" /> Pausada</span>
                    }
                  </td>
                  <td className="py-3.5 px-2 text-right mono-numbers text-text-secondary">{fmt$(camp.spend)}</td>
                  <td className="py-3.5 px-2 text-right mono-numbers text-text-secondary">{fmtN(camp.impressions)}</td>
                  <td className="py-3.5 px-2 text-right mono-numbers text-white font-bold">{camp.leads || 0}</td>
                  <td className="py-3.5 px-2 text-right mono-numbers text-gold-primary font-bold">{fmtX(camp.roas)}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="py-8 text-center text-text-muted">Nenhuma campanha com dados no período. Verifique o token da Meta nas variáveis de ambiente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MetaAdsReport;
