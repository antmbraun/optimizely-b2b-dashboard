import { useState, useEffect } from 'react';
import { fetchExperiments, fetchCampaigns } from '../services/optimizelyApi';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for fetching Optimizely data
 * @returns {Object} Object containing experiments data, campaigns data, and loading state
 */
export default function useOptimizelyData() {
  const [experimentsData, setExperiments] = useState([]);
  const [campaignsData, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { projectId, apiKey } = useAuth();

  useEffect(() => {
    if (!projectId || !apiKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchExperiments(projectId, apiKey),
      fetchCampaigns(projectId, apiKey)
    ])
      .then(([experimentsData, campaignsData]) => {
        setExperiments(experimentsData);
        setCampaigns(campaignsData);
      })
      .catch(err => {
        console.error('Error fetching Optimizely data:', err);
        setError(err.message || 'Failed to fetch data from Optimizely');
      })
      .finally(() => setIsLoading(false));
  }, [projectId, apiKey]);

  return { 
    experimentsData, 
    campaignsData, 
    isLoading, 
    error,
    setExperiments,
    setCampaigns
  };
} 