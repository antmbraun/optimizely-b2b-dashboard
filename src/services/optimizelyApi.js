const BASE_URL = import.meta.env.DEV ? '/api' : 'https://api.optimizely.com/v2';
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 1 day

/**
 * Fetch data from the Optimizely API with caching.
 *
 * @param {string} endpoint - The API endpoint (e.g., '/experiments?project_id=...')
 * @param {string} apiKey - The Optimizely API key
 * @returns {Promise<any>} - The API response data.
 */
async function fetchOptimizely(endpoint, apiKey) {
  if (!apiKey) {
    throw new Error('API key is missing. Please log in again.');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
}

// Get all experiments for a project
export async function fetchExperiments(projectId, apiKey) {
  const cachedData = localStorage.getItem("experimentData");
  const cachedTime = localStorage.getItem("experimentDataTime");

  if (cachedData && cachedTime && (Date.now() - cachedTime < CACHE_EXPIRATION_TIME)) {
    return JSON.parse(cachedData);
  }

  if (!projectId) {
    throw new Error('Project ID is missing. Please log in again.');
  }

  // The api only returns 100 experiments at a time, so we need to paginate.
  let page = 1;
  let experiments = [];

  do {
    const params = new URLSearchParams({
      per_page: '100',
      project_id: projectId,
      page: page,
    });

    const data = await fetchOptimizely(`/experiments?${params.toString()}`, apiKey);
    experiments = experiments.concat(data);
    page++;
  }
  while (experiments.length % 100 === 0);

  let processedExperimentData = {
    a_b_tests: [],
    personalization_campaigns: [],
  }
  for (const experiment of experiments) {
    if (experiment.status !== 'running') {
      continue;
    }
    const results = await fetchOptimizely(`/experiments/${experiment.id}/results`, apiKey);
    experiment.metrics = results.metrics;

    // Get shareable link for Optimizely results page
    const shareableLink = await fetchOptimizely(`/experiments/${experiment.id}/results/share`, apiKey);
    experiment.shareable_link = shareableLink.url;

    if (experiment.type === 'a/b') {
      processedExperimentData.a_b_tests.push(experiment);
    } else {
      processedExperimentData.personalization_campaigns.push(experiment);
    }
  }

  // Cache the data
  localStorage.setItem('experimentData', JSON.stringify(processedExperimentData));
  localStorage.setItem('experimentDataTime', Date.now());

  return processedExperimentData;
}

// Get all campaigns for a project
export async function fetchCampaigns(projectId, apiKey) {
  const cachedData = localStorage.getItem("campaignData");
  const cachedTime = localStorage.getItem("campaignDataTime");

  if (cachedData && cachedTime && (Date.now() - cachedTime < CACHE_EXPIRATION_TIME)) {
    return JSON.parse(cachedData);
  }

  if (!projectId) {
    throw new Error('Project ID is missing. Please log in again.');
  }

  let page = 1;
  let campaigns = [];

  do {
    const params = new URLSearchParams({
      per_page: '100',
      project_id: projectId,
      page: page,
    });

    const data = await fetchOptimizely(`/campaigns?${params.toString()}`, apiKey);
    campaigns = campaigns.concat(data);
    page++;
  }
  while (campaigns.length % 100 === 0);

  campaigns = campaigns.filter(campaign => campaign.status === 'running');

  localStorage.setItem('campaignData', JSON.stringify(campaigns));
  localStorage.setItem('campaignDataTime', Date.now());

  return campaigns;
}

// Get results for a specific experiment
export async function getExperimentResults(experimentId, apiKey) {
  return fetchOptimizely(`/experiments/${experimentId}/results`, apiKey);
}

// // Get results for a specific campaign
// export async function getCampaignResults(campaignId, apiKey) {
//   return fetchOptimizely(`/campaigns/${campaignId}/results`, apiKey);
// }

// // Get variations for a specific experiment
// export async function getExperimentVariations(experimentId, apiKey) {
//   return fetchOptimizely(`/experiments/${experimentId}/variations`, apiKey);
// }