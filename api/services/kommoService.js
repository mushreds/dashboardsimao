import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const subDomain = process.env.KOMMO_SUBDOMAIN || 'simaosereno';
const token = process.env.KOMMO_TOKEN;
const baseURL = `https://${subDomain}.kommo.com/api/v4`;

const client = axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const handleApiError = (error, context) => {
  const status = error.response?.status;
  const data = error.response?.data;
  console.error(`Error in ${context}: [Status ${status}]`, data || error.message);
  throw new Error(`Kommo API error in ${context}: ${status || error.message}`);
};

export const getPipelines = async () => {
  try {
    const response = await client.get('/leads/pipelines');
    return response.data?._embedded?.pipelines || [];
  } catch (error) {
    handleApiError(error, 'getPipelines');
  }
};

export const getUsers = async () => {
  try {
    const response = await client.get('/users');
    return response.data?._embedded?.users || [];
  } catch (error) {
    handleApiError(error, 'getUsers');
  }
};

export const getCustomFields = async () => {
  try {
    const response = await client.get('/leads/custom_fields');
    return response.data?._embedded?.custom_fields || [];
  } catch (error) {
    handleApiError(error, 'getCustomFields');
  }
};

export const getLeads = async (params = {}) => {
  try {
    const queryParams = {
      limit: 250,
      page: 1,
      with: 'contacts',
      ...params
    };

    let allLeads = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page ${queryParams.page} of leads...`);
      const response = await client.get('/leads', { params: queryParams });
      const leads = response.data?._embedded?.leads || [];
      allLeads = [...allLeads, ...leads];

      if (response.data?._links?.next && leads.length === queryParams.limit) {
        queryParams.page += 1;
      } else {
        hasMore = false;
      }
    }

    return allLeads;
  } catch (error) {
    handleApiError(error, 'getLeads');
  }
};
