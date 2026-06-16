import React, { useState, useEffect } from 'react';
import { getSimaoReport } from '../services/api';
import { RefreshCw, Sparkles } from 'lucide-react';

const SimaoReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try { setData(await getSimaoReport()); } catch (err) { console.error(err); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (loading || !data) {
    return (
      <div className="w-full min-h-screen bg-[#0B0B0C] p-6 animate-pulse flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-80">
          {[1,2,3].map(i => <div key={i} className="bg-bg-secondary rounded-2xl" />)}
        </div>
        <div className="h-44 bg-bg-secondary rounded-2xl" />
      </div>
    );
  }

  const maxMonthlyLeads = Math.max(...data.monthlyComparison.map(m => Math.max(m.esteAno, m.anoPassado)), 100);
  const maxWeeklyLeads = Math.max(...data.monthWeeks.map(w => w.count), 20);
  const linePoints = data.monthWeeks.map((week, idx) => ({
    x: 40 + idx * 80, y: 110 - (week.count / maxWeeklyLeads) * 90, label: week.label, count: week.count
  }));
  const linePathD = linePoints.reduce((path, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    const prev = linePoints[idx - 1];
    return `${path} C ${prev.x + 40} ${prev.y}, ${p.x - 40} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="w-full flex flex-col gap-6 select-none p-6 bg-[#0B0B0C] min-h-screen text-text-primary">
      <div className="flex items-center justify-between pb-4 border-b border-border-card">
        <div className="flex flex-col text-left">
          <h2 className="text-xl font-bold tracking-widest text-text-secondary uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-primary" /> Total de Leads Diário
          </h2>
          <span className="text-[10px] text-text-muted font-medium tracking-wider mt-0.5">Monitor diário de entrada de leads</span>
        </div>
        <button onClick={() => loadData(true)} disabled={refreshing}
          className="p-2 bg-bg-secondary border border-border-card text-gold-primary hover:text-white rounded-full shadow hover:border-gold-primary transition-all duration-300 disabled:opacity-50 cursor-pointer hover:-rotate-180">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Comparativo Mensal */}
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex flex-col justify-between h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase">Comparativo Anual</span>
            <div className="flex items-center gap-2 text-[8px] font-bold tracking-wider">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gold-primary inline-block" /> 2026</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-border-card inline-block" /> 2025</span>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 h-36 px-2">
            {data.monthlyComparison.map((m) => {
              const hEsteAno = (m.esteAno / maxMonthlyLeads) * 100;
              const hAnoPassado = (m.anoPassado / maxMonthlyLeads) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center flex-1 gap-2">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div style={{ height: `${hAnoPassado}%` }} className="w-3.5 bg-bg-tertiary border border-border-card rounded-t-sm transition-all duration-500" title={`2025: ${m.anoPassado}`} />
                    <div style={{ height: `${hEsteAno}%` }} className="w-3.5 bg-gold-primary border border-gold-dark rounded-t-sm hover:bg-gold-hover transition-all duration-500" title={`2026: ${m.esteAno}`} />
                  </div>
                  <span className="text-[9px] font-black text-text-muted tracking-wider">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leads Hoje */}
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center h-[300px]">
          <span className="text-[10px] font-black text-text-muted tracking-widest uppercase mb-4">Hoje Chegaram:</span>
          <div className="relative w-44 h-44 rounded-full border-4 border-gold-primary/30 flex flex-col items-center justify-center bg-[#0F1010]">
            <div className="absolute inset-2 rounded-full border border-dashed border-gold-primary/20" />
            <span className="text-[10px] font-black tracking-[0.2em] text-gold-primary uppercase">Diário</span>
            <span className="text-5xl font-black text-white my-1 mono-numbers text-gold-gradient">{data.leadsHoje}</span>
            <span className="text-[10px] font-black tracking-[0.2em] text-text-secondary uppercase mt-1">Leads</span>
          </div>
        </div>

        {/* Semanas do Mês */}
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex flex-col justify-between h-[300px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-text-secondary tracking-widest uppercase">Leads por Semana</span>
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">mês corrente</span>
          </div>
          <div className="flex-1 w-full relative flex items-center justify-center">
            <svg className="w-full h-36" viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg">
              {[0,1,2].map(i => <line key={i} x1="20" y1={20 + i * 45} x2="300" y2={20 + i * 45} stroke="#1C1D21" strokeWidth="1" strokeDasharray="4 4" />)}
              {linePathD && <path d={linePathD} fill="none" stroke="#817566" strokeWidth="3.5" strokeLinecap="round" />}
              {linePoints.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#817566" strokeWidth="2.5" />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#FFF3E3" fontSize="9" fontWeight="bold">{p.count}</text>
                  <text x={p.x} y="125" textAnchor="middle" fill="#686868" fontSize="9" fontWeight="bold">{p.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="bg-[#14171B] border border-border-card rounded-2xl p-6 shadow-lg flex flex-col gap-6">
        <div className="flex flex-col text-left border-b border-[#222326] pb-2">
          <h3 className="text-xs font-bold tracking-widest text-text-secondary uppercase">Desempenho Diário da Semana Corrente</h3>
        </div>
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-7 gap-3 sm:gap-4 w-full pb-2 sm:pb-0 scrollbar-none">
          {data.weekLeads.map((day, idx) => {
            const labels = ['Seg','Ter','Qua','Qui','Hoje','Sáb','Dom'];
            const dayOfWeek = new Date().getDay();
            const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const isToday = idx === todayIdx;
            const isFuture = idx > todayIdx;
            return (
              <div key={idx} className={`flex-shrink-0 w-24 sm:w-auto flex flex-col items-center justify-between rounded-xl p-4 h-28 border transition-all duration-300 relative ${
                isToday ? 'bg-[#1C1712]/30 border-gold-primary shadow-[0_0_15px_rgba(129,117,102,0.2)]'
                  : isFuture ? 'bg-bg-primary/20 border-[#222326] opacity-40'
                  : 'bg-bg-primary/50 border-[#222326] hover:border-gold-border'
              }`}>
                <span className={`text-sm font-black tracking-widest ${isToday ? 'text-gold-primary' : 'text-text-secondary'}`}>{day.label}</span>
                <div className="flex flex-col items-center">
                  <span className={`text-2xl font-black mono-numbers leading-none ${isToday ? 'text-white' : isFuture ? 'text-text-muted' : 'text-white'}`}>{day.count}</span>
                  <span className="text-[7px] text-text-muted font-bold tracking-widest uppercase mt-1 leading-none">Leads</span>
                </div>
                <span className="text-[7px] font-bold text-text-muted tracking-widest uppercase select-none leading-none">{labels[idx]}</span>
                {isToday && <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gold-primary animate-ping" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimaoReport;
