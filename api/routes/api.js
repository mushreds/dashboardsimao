import express from 'express';
import NodeCache from 'node-cache';
import * as kommoService from '../services/kommoService.js';
import * as metaAdsService from '../services/metaAdsService.js';

const router = express.Router();
const cacheTTL = parseInt(process.env.CACHE_TTL || '300', 10);
const apiCache = new NodeCache({ stdTTL: cacheTTL, checkperiod: cacheTTL * 0.2 });

const PIPELINE_CONSULTA_ID = 11626995;
const PIPELINE_CIRURGIA_ID = 11649015;

const CONSOLIDATED_PIPELINES_FILTER = {
  "11626995": ["101033719","101084843","101537307","104676051","92628163","92648831","93645571","93645575","95292807","95292811","96003771"],
  "11649015": ["101534923","101534991","92628651","92628655","92628659","92647035","92648875"],
  "11649019": ["101036711","102712215","142","143","92627555"],
  "12010351": ["92644687"],
  "12121895": ["93589023","93589027","93589031"],
  "13103191": ["101033907","101033911","101033915","101037979"],
  "13135035": ["101286059","101286063","101288607","104668351","104668395","104668399"],
  "13327895": ["102785703","102785707","102785711","104648747","104648751","104648755","104648759","104648763","104648767"]
};

const CONSULTA_STAGES = [
  { name: 'TOTAL LEADS', ids: null },
  { name: 'INTERACOES', ids: ['93645575','104676051','96003771','95292807','95292811','92628163','101033719','142'] },
  { name: 'APN / OFERTA FEITA', ids: ['95292811','92628163','101033719','142'] },
  { name: 'EM NEGOCIACAO', ids: ['92628163','101033719','142'] },
  { name: 'AGUARDANDO PAGAMENTO', ids: ['101033719','142'] },
  { name: 'VENDAS', ids: ['142'] }
];

const CIRURGIA_STAGES = [
  { name: 'PASSOU EM CONSULTA', ids: null },
  { name: 'EM NEGOCIACAO', ids: ['92628659','101534923','142'] },
  { name: 'AGUARDANDO PAGAMENTO', ids: ['101534923','142'] },
  { name: 'VENDAS', ids: ['142'] }
];

router.get('/config', (req, res) => {
  res.json({
    metaVgv: parseFloat(process.env.META_VGV || '1200000'),
    metaConsulta: parseInt(process.env.META_CONSULTA || '50', 10),
    metaCirurgia: parseInt(process.env.META_CIRURGIA || '16', 10),
    investimento: parseFloat(process.env.INVESTIMENTO || '19469'),
  });
});

router.get('/pipelines', async (req, res, next) => {
  try {
    const cacheKey = 'kommo_pipelines';
    let pipelines = apiCache.get(cacheKey);
    if (!pipelines) { pipelines = await kommoService.getPipelines(); apiCache.set(cacheKey, pipelines); }
    res.json(pipelines);
  } catch (error) { next(error); }
});

router.get('/users', async (req, res, next) => {
  try {
    const cacheKey = 'kommo_users';
    let users = apiCache.get(cacheKey);
    if (!users) { users = await kommoService.getUsers(); apiCache.set(cacheKey, users); }
    res.json(users);
  } catch (error) { next(error); }
});

router.get('/custom-fields', async (req, res, next) => {
  try {
    const cacheKey = 'kommo_custom_fields';
    let cf = apiCache.get(cacheKey);
    if (!cf) { cf = await kommoService.getCustomFields(); apiCache.set(cacheKey, cf); }
    res.json(cf);
  } catch (error) { next(error); }
});

router.delete('/cache/clear', (req, res) => {
  apiCache.flushAll();
  res.json({ message: 'Cache cleared successfully' });
});

router.get('/metrics/overview', async (req, res, next) => {
  try {
    const { startDate, endDate, pipelineId, consultaType, formSource } = req.query;
    let filterParams = {};
    if (startDate && endDate) {
      filterParams['filter[created_at][from]'] = Math.floor(new Date(startDate + 'T00:00:00').getTime() / 1000);
      filterParams['filter[created_at][to]'] = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);
    }
    const cacheKey = 'metrics_overview_' + JSON.stringify({ startDate, endDate, pipelineId, consultaType, formSource });
    let cached = apiCache.get(cacheKey);
    if (cached) return res.json(cached);

    let leads = await kommoService.getLeads(filterParams);

    let users = apiCache.get('kommo_users');
    if (!users) { users = await kommoService.getUsers(); apiCache.set('kommo_users', users); }
    const usersMap = users.reduce((a, u) => { a[u.id] = u.name; return a; }, {});

    if (pipelineId) leads = leads.filter(l => l.pipeline_id === parseInt(pipelineId, 10));
    if (consultaType) {
      leads = leads.filter(l => {
        const cf = l.custom_fields_values?.find(c => c.field_id === 804690);
        return cf?.values?.some(v => v.value === consultaType);
      });
    }
    if (formSource) {
      if (formSource === 'Formulario') {
        leads = leads.filter(l => { const cf = l.custom_fields_values?.find(c => c.field_id === 806922); return cf?.values?.some(v => v.value === 'Formulario'); });
      } else {
        leads = leads.filter(l => (l._embedded?.tags || []).some(t => t.name.toLowerCase() === formSource.toLowerCase()));
      }
    }

    let pipelines = apiCache.get('kommo_pipelines');
    if (!pipelines) { try { pipelines = await kommoService.getPipelines(); apiCache.set('kommo_pipelines', pipelines); } catch { pipelines = []; } }

    const consultaLeads = leads.filter(l => l.pipeline_id === PIPELINE_CONSULTA_ID);
    const cirurgiaLeads = leads.filter(l => l.pipeline_id === PIPELINE_CIRURGIA_ID);

    const vendasConsultaCount = consultaLeads.filter(l => String(l.status_id) === '142').length;
    const vgvConsulta = consultaLeads.filter(l => String(l.status_id) === '142').reduce((s, l) => s + (l.price || 0), 0);
    const vendasCirurgiaCount = cirurgiaLeads.filter(l => String(l.status_id) === '142').length;
    const vgvCirurgia = cirurgiaLeads.filter(l => String(l.status_id) === '142').reduce((s, l) => s + (l.price || 0), 0);

    const vgvTotal = vgvConsulta + vgvCirurgia;
    const taxaConversaoConsulta = consultaLeads.length > 0 ? (vendasConsultaCount / consultaLeads.length) * 100 : 0;
    const taxaConversaoCirurgia = cirurgiaLeads.length > 0 ? (vendasCirurgiaCount / cirurgiaLeads.length) * 100 : 0;
    const ticketMedioConsulta = vendasConsultaCount > 0 ? vgvConsulta / vendasConsultaCount : 0;
    const ticketMedioCirurgia = vendasCirurgiaCount > 0 ? vgvCirurgia / vendasCirurgiaCount : 0;

    let investimento = 0;
    try {
      const s = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const e = endDate || new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).toISOString().split('T')[0];
      const metaData = await metaAdsService.getCampaignsInsights(s, e);
      if (metaData?.insightsData) investimento = metaData.insightsData.reduce((s, i) => s + parseFloat(i.spend || 0), 0);
    } catch { investimento = parseFloat(process.env.INVESTIMENTO || '0'); }

    const metaVgv = parseFloat(process.env.META_VGV || '1200000');

    const consultaFunnel = CONSULTA_STAGES.map(stage => {
      const matching = stage.ids === null ? consultaLeads : consultaLeads.filter(l => stage.ids.includes(String(l.status_id)));
      return { name: stage.name, count: matching.length, txConversao: consultaLeads.length > 0 ? (matching.length / consultaLeads.length) * 100 : 0, custo: matching.reduce((s, l) => s + (l.price || 0), 0) };
    });

    const cirurgiaFunnel = CIRURGIA_STAGES.map(stage => {
      const matching = stage.ids === null ? cirurgiaLeads : cirurgiaLeads.filter(l => stage.ids.includes(String(l.status_id)));
      return { name: stage.name, count: matching.length, txConversao: cirurgiaLeads.length > 0 ? (matching.length / cirurgiaLeads.length) * 100 : 0, custo: matching.reduce((s, l) => s + (l.price || 0), 0) };
    });

    const salesByVendor = {};
    leads.forEach(l => {
      if (String(l.status_id) === '142') {
        const name = usersMap[l.responsible_user_id] || 'Desconhecido';
        if (!salesByVendor[name]) salesByVendor[name] = { name, vgv: 0, vendas: 0 };
        salesByVendor[name].vgv += (l.price || 0);
        salesByVendor[name].vendas += 1;
      }
    });
    const rankingVendedores = Object.values(salesByVendor)
      .map(v => ({ ...v, pctVgv: metaVgv > 0 ? (v.vgv / metaVgv) * 100 : 0 }))
      .sort((a, b) => b.vgv - a.vgv);

    const consolidatedLeads = leads.filter(l => {
      const p = String(l.pipeline_id), s = String(l.status_id);
      return CONSOLIDATED_PIPELINES_FILTER[p]?.includes(s);
    });

    const metrics = {
      vgvTotal, taxaConversaoConsulta, taxaConversaoCirurgia, ticketMedioConsulta, ticketMedioCirurgia,
      investimento, roas: investimento > 0 ? vgvTotal / investimento : 0,
      consultaFunnel, cirurgiaFunnel, rankingVendedores,
      totalVendasCount: vendasConsultaCount + vendasCirurgiaCount,
      vendasConsultaCount, vendasCirurgiaCount,
      passouConsultaCount: cirurgiaLeads.length,
      totalConsultaLeadsCount: consultaLeads.length,
      totalCirurgiaLeadsCount: cirurgiaLeads.length,
      totalLeadsCount: consolidatedLeads.length
    };

    apiCache.set(cacheKey, metrics);
    res.json(metrics);
  } catch (error) { next(error); }
});

router.get('/metrics/simao-report', async (req, res, next) => {
  try {
    const cacheKey = 'simao_page_report_metrics';
    let reportData = apiCache.get(cacheKey);
    if (reportData) return res.json(reportData);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = Math.floor(new Date(today.getFullYear(), today.getMonth(), 1).getTime() / 1000);
    const monthEnd = Math.floor(new Date(today.getFullYear(), today.getMonth()+1, 0, 23, 59, 59).getTime() / 1000);

    const currentMonthLeads = await kommoService.getLeads({ 'filter[created_at][from]': monthStart, 'filter[created_at][to]': monthEnd });

    const startOfToday = Math.floor(new Date(todayStr + 'T00:00:00').getTime() / 1000);
    const endOfToday = Math.floor(new Date(todayStr + 'T23:59:59').getTime() / 1000);
    const leadsHoje = currentMonthLeads.filter(l => l.created_at >= startOfToday && l.created_at <= endOfToday).length;

    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekLeads = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const s = Math.floor(new Date(d.toISOString().split('T')[0] + 'T00:00:00').getTime() / 1000);
      const e = Math.floor(new Date(d.toISOString().split('T')[0] + 'T23:59:59').getTime() / 1000);
      const isFuture = d > today;
      return { label: ['S','T','Q','Q','S','S','D'][i], count: isFuture ? 0 : currentMonthLeads.filter(l => l.created_at >= s && l.created_at <= e).length };
    });

    const year = today.getFullYear(), month = today.getMonth();
    const monthWeeks = [
      { label: 'S1', start: new Date(year, month, 1), end: new Date(year, month, 7) },
      { label: 'S2', start: new Date(year, month, 8), end: new Date(year, month, 14) },
      { label: 'S3', start: new Date(year, month, 15), end: new Date(year, month, 21) },
      { label: 'S4', start: new Date(year, month, 22), end: new Date(year, month+1, 0) }
    ].map(w => ({
      label: w.label,
      count: w.start > today ? 0 : currentMonthLeads.filter(l => {
        const ts = l.created_at * 1000;
        return ts >= w.start.getTime() && ts <= new Date(w.end.toISOString().split('T')[0] + 'T23:59:59').getTime();
      }).length
    }));

    const monthlyComparison = [
      { month: 'JAN', esteAno: 248, anoPassado: 198 }, { month: 'FEV', esteAno: 220, anoPassado: 210 },
      { month: 'MAR', esteAno: 295, anoPassado: 250 }, { month: 'ABR', esteAno: 270, anoPassado: 245 },
      { month: 'MAI', esteAno: 345, anoPassado: 280 }, { month: 'JUN', esteAno: currentMonthLeads.length, anoPassado: 220 }
    ];

    reportData = { leadsHoje, weekLeads, monthWeeks, monthlyComparison };
    apiCache.set(cacheKey, reportData);
    res.json(reportData);
  } catch (error) { next(error); }
});

router.get('/metrics/meta-ads', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    const start = startDate || fmt(new Date(today.getFullYear(), today.getMonth(), 1));
    const end = endDate || fmt(new Date(today.getFullYear(), today.getMonth()+1, 0));

    const cacheKey = 'meta_ads_real_' + start + '_' + end;
    let cached = apiCache.get(cacheKey);
    if (cached) return res.json(cached);

    const metaData = await metaAdsService.getCampaignsInsights(start, end);
    if (!metaData?.insightsData?.length) {
      return res.json({ error: true, summary: { totalSpend:0,totalImpressions:0,totalClicks:0,avgCtr:0,avgCpc:0,totalLeads:0,avgCpl:0,totalVgv:0,avgRoas:0 }, campaigns:[], dailyEvolution:[] });
    }

    const ts = Math.floor(new Date(start+'T00:00:00').getTime()/1000);
    const te = Math.floor(new Date(end+'T23:59:59').getTime()/1000);
    const leads = await kommoService.getLeads({ 'filter[created_at][from]': ts, 'filter[created_at][to]': te });
    const campaignsMap = metaData.campaignsMeta.reduce((a, c) => { a[c.id]=c; return a; }, {});

    let totalSpend=0, totalImpressions=0, totalClicks=0, totalLeadsCount=0, totalVgvSum=0;
    const campaigns = metaData.insightsData.map(insight => {
      const spend = parseFloat(insight.spend||0), impressions = parseInt(insight.impressions||0,10), clicks = parseInt(insight.clicks||0,10);
      const matchingLeads = leads.filter(l => { const v = l.custom_fields_values?.find(cf=>cf.field_id===703812)?.values?.[0]?.value||''; return v.toLowerCase()===insight.campaign_name.toLowerCase()||v===insight.campaign_id; });
      const vgvSum = matchingLeads.filter(l=>String(l.status_id)==='142').reduce((s,l)=>s+(l.price||0),0);
      totalSpend+=spend; totalImpressions+=impressions; totalClicks+=clicks; totalLeadsCount+=matchingLeads.length; totalVgvSum+=vgvSum;
      return { id: insight.campaign_id, name: insight.campaign_name, status: campaignsMap[insight.campaign_id]?.status||'UNKNOWN', spend, impressions, clicks, leads: matchingLeads.length, vgv: vgvSum, cpl: matchingLeads.length>0?spend/matchingLeads.length:0, roas: spend>0?vgvSum/spend:0 };
    });

    const result = {
      summary: { totalSpend, totalImpressions, totalClicks, avgCtr: totalImpressions>0?totalClicks/totalImpressions:0, avgCpc: totalClicks>0?totalSpend/totalClicks:0, totalLeads: totalLeadsCount, avgCpl: totalLeadsCount>0?totalSpend/totalLeadsCount:0, totalVgv: totalVgvSum, avgRoas: totalSpend>0?totalVgvSum/totalSpend:0 },
      campaigns,
      dailyEvolution: metaData.dailyData.map(d => ({ date: d.date_start, formattedDate: new Date(d.date_start+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), spend: parseFloat(d.spend||0), clicks: parseInt(d.clicks||0,10), leads: 0 })).sort((a,b)=>a.date.localeCompare(b.date))
    };

    apiCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /metrics/meta-ads:', error);
    res.json({ error:true, summary:{totalSpend:0,totalImpressions:0,totalClicks:0,avgCtr:0,avgCpc:0,totalLeads:0,avgCpl:0,totalVgv:0,avgRoas:0}, campaigns:[], dailyEvolution:[] });
  }
});

export default router;
