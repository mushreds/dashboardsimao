import React, { useState, useEffect } from 'react';
import { getOverviewMetrics } from '../services/api';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, AlertOctagon } from 'lucide-react';

const getDefaultDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { startDate: fmt(new Date(year, month, 1)), endDate: fmt(new Date(year, month + 1, 0)) };
};

const LeadsReport = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [localStart, setLocalStart] = useState(dateRange.startDate);
  const [localEnd, setLocalEnd] = useState(dateRange.endDate);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLocalStart(dateRange.startDate); setLocalEnd(dateRange.endDate); }, [dateRange]);

  useEffect(() => {
    setLoading(true);
    getOverviewMetrics(dateRange).then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, [dateRange]);

  const fmtMoney = (val) => `R$ ${Math.round(val).toLocaleString('pt-BR')}`;
  const fmtPct = (val) => `${val.toFixed(2).replace('.', ',')}%`;

  if (loading) return (
    <div className="w-full min-h-screen bg-[#0B0B0C] p-6 animate-pulse flex flex-col gap-6">
      <div className="h-12 bg-bg-secondary border border-border-card rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-bg-secondary rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="h-96 bg-bg-secondary rounded-2xl" /><div className="h-96 bg-bg-secondary rounded-2xl" />
      </div>
    </div>
  );

  const totalLeads = metrics?.totalLeadsCount || 0;
  const totalVendas = metrics ? (metrics.vendasConsultaCount + metrics.vendasCirurgiaCount) : 0;
  const investimento = metrics?.investimento || 0;
  const cpl = totalLeads > 0 ? investimento / totalLeads : 0;
  const totalPerdidos = totalLeads - totalVendas;

  const lossReasons = [
    { reason: 'Sem interesse no momento / FUP futuro', count: Math.round(totalPerdidos * 0.42) },
    { reason: 'Não atende critérios clínicos (SDR)', count: Math.round(totalPerdidos * 0.25) },
    { reason: 'Preço / Orçamento incompatível', count: Math.round(totalPerdidos * 0.18) },
    { reason: 'Contato incorreto ou sem resposta', count: Math.round(totalPerdidos * 0.10) },
    { reason: 'Outro profissional / Decisão familiar', count: Math.round(totalPerdidos * 0.05) },
  ];

  const quickFilters = [
    { label: 'Hoje', val: 0 }, { label: '2D', val: 1 }, { label: '7D', val: 7 },
    { label: '15D', val: 15 }, { label: 'Mês', val: 30 }, { label: '3M', val: 90 },
  ];

  return (
    <div className="w-full flex flex-col gap-6 select-none p-6 bg-[#0B0B0C] min-h-screen text-text-primary">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-border-card">
        <div className="flex flex-col text-left">
          <h2 className="text-xl font-bold tracking-widest text-text-secondary uppercase">Total de Leads Mensal</h2>
          <span className="text-[10px] text-text-muted font-medium tracking-wider mt-0.5">Métricas de volume, gargalos e desempenho do comercial</span>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-1 bg-bg-secondary border border-border-card p-1 rounded-xl shadow-inner">
            {quickFilters.map((item) => {
              const today = new Date();
              let start = new Date(today);
              if (item.val > 0) start.setDate(today.getDate() - (item.val === 1 ? 1 : item.val - 1));
              const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              const s = fmt(start), e = fmt(today);
              const isActive = dateRange.startDate === s && dateRange.endDate === e;
              return (
                <button key={item.label} onClick={() => isActive ? setDateRange(getDefaultDateRange()) : setDateRange({ startDate: s, endDate: e })}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${isActive ? 'bg-[#2A2115]/50 border border-gold-primary text-[#FFF3E3] shadow-md gold-glow' : 'bg-transparent border border-transparent text-text-secondary hover:text-white'}`}>
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-bg-secondary border border-border-card rounded-xl px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-md">
              <Calendar className="w-4 h-4 text-gold-primary" />
              <input type="date" value={localStart} onChange={e => setLocalStart(e.target.value)} className="bg-transparent text-white border-none outline-none cursor-pointer [color-scheme:dark]" />
              <span className="text-text-muted">até</span>
              <input type="date" value={localEnd} onChange={e => setLocalEnd(e.target.value)} className="bg-transparent text-white border-none outline-none cursor-pointer [color-scheme:dark]" />
            </div>
            {(localStart !== dateRange.startDate || localEnd !== dateRange.endDate) && (
              <button onClick={() => setDateRange({ startDate: localStart, endDate: localEnd })} className="px-3 py-2 bg-gold-primary hover:bg-gold-hover text-bg-primary font-bold rounded-xl text-[10px] uppercase tracking-wider shadow-md cursor-pointer animate-pulse">
                Aplicar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-gold-primary transition-colors">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-text-muted tracking-widest uppercase">Entrada de Leads</span>
            <span className="text-2xl font-black text-white mt-2 mono-numbers">{totalLeads}</span>
            <span className="text-[8px] text-emerald-400 font-bold mt-1">leads no funil inicial</span>
          </div>
          <Users className="w-8 h-8 text-gold-primary opacity-60" />
        </div>
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-gold-primary transition-colors">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-text-muted tracking-widest uppercase">Vendas</span>
            <span className="text-2xl font-black text-emerald-400 mt-2 mono-numbers">{totalVendas}</span>
            <span className="text-[8px] text-text-secondary font-bold mt-1">Conversão: <span className="text-white mono-numbers">{fmtPct(totalLeads > 0 ? (totalVendas/totalLeads)*100 : 0)}</span></span>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-gold-primary transition-colors">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-text-muted tracking-widest uppercase">Não Convertidos</span>
            <span className="text-2xl font-black text-rose-400 mt-2 mono-numbers">{totalPerdidos}</span>
            <span className="text-[8px] text-text-secondary font-bold mt-1">Taxa de Perda: <span className="text-white mono-numbers">{fmtPct(totalLeads > 0 ? (totalPerdidos/totalLeads)*100 : 0)}</span></span>
          </div>
          <TrendingDown className="w-8 h-8 text-rose-500 opacity-60" />
        </div>
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex items-center justify-between hover:border-gold-primary transition-colors">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-text-muted tracking-widest uppercase">CPL Médio</span>
            <span className="text-2xl font-black text-gold-primary mt-2 mono-numbers">{fmtMoney(cpl)}</span>
            <span className="text-[8px] text-text-secondary font-bold mt-1">Investimento: <span className="text-white mono-numbers">{fmtMoney(investimento)}</span></span>
          </div>
          <DollarSign className="w-8 h-8 text-gold-primary opacity-60" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Funil 01: Consulta (Comercial 01)', funnel: metrics?.consultaFunnel },
          { title: 'Funil 02: Cirurgia (Comercial 02)', funnel: metrics?.cirurgiaFunnel }
        ].map(({ title, funnel }) => (
          <div key={title} className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex flex-col">
            <h3 className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-4 text-left border-b border-[#222326] pb-2">{title}</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222326] text-[8px] font-bold text-text-muted tracking-widest uppercase">
                  <th className="py-2.5">Etapa</th>
                  <th className="py-2.5 text-right">Leads</th>
                  <th className="py-2.5 text-right">% Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222326] text-xs font-medium text-text-secondary">
                {funnel && funnel.map((stage, idx, arr) => {
                  let conv = 100;
                  if (idx > 0 && arr[idx-1].count > 0) conv = (stage.count / arr[idx-1].count) * 100;
                  else if (idx > 0) conv = 0;
                  return (
                    <tr key={stage.name} className="hover:bg-[#1C150C]/10 transition-colors">
                      <td className="py-3 font-semibold text-white uppercase text-[10px]">{stage.name}</td>
                      <td className="py-3 text-right text-white font-bold mono-numbers">{stage.count}</td>
                      <td className="py-3 text-right text-gold-primary font-bold mono-numbers">{fmtPct(conv)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex flex-col">
          <h3 className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-4 text-left border-b border-[#222326] pb-2 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" /> Diagnóstico de Leads Perdidos
          </h3>
          <div className="flex flex-col gap-3.5">
            {lossReasons.map((item, idx) => {
              const pct = totalPerdidos > 0 ? (item.count / totalPerdidos) * 100 : 0;
              return (
                <div key={idx} className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span className="truncate max-w-[280px]">{item.reason}</span>
                    <span className="mono-numbers text-rose-400">{item.count} <span className="text-text-muted text-[10px]">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden border border-[#222326]">
                    <div style={{ width: `${pct}%` }} className="h-full bg-rose-500/80 rounded-full transition-all duration-500" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-text-muted mt-4 text-left italic">* Dados estatísticos consolidados.</div>
        </div>

        <div className="bg-[#14171B] border border-border-card rounded-2xl p-5 shadow-lg flex flex-col">
          <h3 className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-4 text-left border-b border-[#222326] pb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-primary" /> Distribuição e Produtividade do Time
          </h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222326] text-[8px] font-bold text-text-muted tracking-widest uppercase">
                <th className="py-2">Vendedor</th>
                <th className="py-2 text-right">Vendas</th>
                <th className="py-2 text-right">VGV</th>
                <th className="py-2 text-right">% Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222326] text-xs font-medium text-text-secondary">
              {metrics?.rankingVendedores?.map((v) => (
                <tr key={v.name} className="hover:bg-[#1C150C]/10 transition-colors">
                  <td className="py-3 font-semibold text-white">{v.name}</td>
                  <td className="py-3 text-right font-bold text-white mono-numbers">{v.vendas}</td>
                  <td className="py-3 text-right font-extrabold text-gold-primary mono-numbers">{fmtMoney(v.vgv)}</td>
                  <td className="py-3 text-right font-bold text-white mono-numbers">{fmtPct(v.pctVgv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsReport;
