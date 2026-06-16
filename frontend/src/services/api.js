import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
});

export const getConfig = async () => (await api.get('/api/config')).data;
export const getPipelines = async () => (await api.get('/api/pipelines')).data;
export const getUsers = async () => (await api.get('/api/users')).data;
export const getOverviewMetrics = async (params = {}) => (await api.get('/api/metrics/overview', { params })).data;
export const getLeadsList = async (params = {}) => (await api.get('/api/leads/list', { params })).data;
export const getSimaoReport = async () => (await api.get('/api/metrics/simao-report')).data;
export const getMetaAdsMetrics = async (params = {}) => (await api.get('/api/metrics/meta-ads', { params })).data;
export const clearCache = async () => (await api.delete('/api/cache/clear')).data;

export default api;
