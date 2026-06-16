import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import KPICard from '../components/KPICard';
import FunnelChart from '../components/FunnelChart';
import VendorRanking from '../components/VendorRanking';
import FilterPanel from '../components/FilterPanel';
import LoadingState from '../components/LoadingState';
import { getOverviewMetrics, getConfig, clearCache } from '../services/api';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const getDefaultDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { startDate: fmt(new Date(year, month, 1)), endDate: fmt(new Date(year, month + 1, 0)) };
};

const OverviewSales = () => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [filters, setFilters] = useState({ pipelineId: '', consultaType: '', formSource: '' });
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadConfig = async () => {
    try { setConfig(await getConfig()); } catch (err) { console.error('Config error:', err); }
  };

  const loadMetrics = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await getOverviewMetrics({ ...dateRange, ...filters });
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados do Kommo CRM. Verifique as credenciais no .env.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadConfig();
    loadMetrics();
  }, [dateRange, filters]);

  useEffect(() => {
    const interval = setInterval(() => loadMetrics(true), 300000);
    return () => clearInterval(interval);
  }, [dateRange, filters]);

  const handleForceReload = async () => {
    setRefreshing(true);
    try { await clearCache(); await loadMetrics(); } catch (err) { console.error(err); } finally { setRefreshing(false); }
  };

  if (loading) return <LoadingState />;

  if (error && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0B0C] text-white p-6">
        <AlertTriangle className="w-16 h-16 text-gold-primary mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro de Comunicação</h2>
        <p className="text-text-secondary text-sm max-w-md mb-6 text-center">{error}</p>
        <button onClick={() => { setError(null); setLoading(true); loadConfig(); loadMetrics(); }}
          className="flex items-center gap-2 bg-gold-primary text-bg-primary hover:bg-gold-hover font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-lg cursor-pointer">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0B0B0C] p-6 flex flex-col gap-6 relative select-none">
      <button onClick={handleForceReload} disabled={refreshing}
        className="absolute bottom-6 right-6 p-3 bg-bg-secondary border border-border-card text-gold-primary hover:text-white rounded-full shadow-2xl hover:border-gold-primary transition-all duration-300 disabled:opacity-50 cursor-pointer z-50 hover:-rotate-180"
        title="Limpar Cache e Sincronizar">
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
      </button>

      <Header metrics={metrics} config={config} dateRange={dateRange} onDateChange={setDateRange} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Realizado VGV" value={metrics.vgvTotal} formatType="money" />
        <KPICard title="Realizado Consulta" value={metrics.taxaConversaoConsulta} formatType="percent" />
        <KPICard title="Realizado Cirurgia" value={metrics.taxaConversaoCirurgia} formatType="percent" />
        <KPICard title="Ticket Médio Consulta" value={metrics.ticketMedioConsulta} formatType="money" />
        <KPICard title="Ticket Médio Cirurgia" value={metrics.ticketMedioCirurgia} formatType="money" />
        <KPICard title="Investimento" value={metrics.investimento} formatType="money" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col gap-6">
          <div className="flex-1 min-h-[320px]">
            <FunnelChart title="Consulta" stages={metrics.consultaFunnel} conversionRate={metrics.taxaConversaoConsulta} totalLeads={metrics.totalConsultaLeadsCount} />
          </div>
          <div className="min-h-[110px]">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex-1 min-h-[320px]">
            <FunnelChart title="Cirurgia" stages={metrics.cirurgiaFunnel} conversionRate={metrics.taxaConversaoCirurgia} totalLeads={metrics.totalCirurgiaLeadsCount} />
          </div>
          <div className="flex-1 min-h-[220px]">
            <VendorRanking vendors={metrics.rankingVendedores} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSales;
