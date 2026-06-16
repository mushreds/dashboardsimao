import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const accessToken = process.env.META_ACCESS_TOKEN;
const adAccountId = process.env.META_AD_ACCOUNT_ID || 'act_537883867807567';
const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

const baseURL = `https://graph.facebook.com/v18.0`;

const client = axios.create({
  baseURL,
  params: {
    access_token: accessToken
  }
});

export const getCampaignsInsights = async (startDate, endDate) => {
  try {
    if (!accessToken) {
      console.warn('Warning: META_ACCESS_TOKEN is not defined in .env.');
      return { campaignsMeta: [], insightsData: [], dailyData: [] };
    }

    const campaignsRes = await client.get(`/${formattedAdAccountId}/campaigns`, {
      params: {
        fields: 'id,name,status,daily_budget,lifetime_budget,budget_remaining',
        limit: 100,
        access_token: accessToken
      }
    });
    const campaignsMeta = campaignsRes.data?.data || [];

    const insightsRes = await client.get(`/${formattedAdAccountId}/insights`, {
      params: {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,video_thruplay_watched_actions',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        limit: 100,
        access_token: accessToken
      }
    });
    const insightsData = insightsRes.data?.data || [];

    const dailyRes = await client.get(`/${formattedAdAccountId}/insights`, {
      params: {
        level: 'account',
        time_increment: 1,
        fields: 'date_start,spend,clicks,impressions',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        limit: 100,
        access_token: accessToken
      }
    });
    const dailyData = dailyRes.data?.data || [];

    return { campaignsMeta, insightsData, dailyData };
  } catch (error) {
    console.error('Error fetching Meta Ads data:', error.response?.data || error.message);
    return { campaignsMeta: [], insightsData: [], dailyData: [] };
  }
};
