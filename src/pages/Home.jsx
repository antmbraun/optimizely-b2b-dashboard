// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useOptimizelyData from '../hooks/useOptimizelyData';
import useSearchFilter from '../hooks/useSearchFilter';
import SearchBar from '../components/SearchBar';
import ExperimentCard from '../components/ExperimentCard';
import CampaignCard from '../components/CampaignCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { fetchExperiments, fetchCampaigns, getExperimentResults } from '../services/optimizelyApi';

export default function Home() {
  const { projectId, apiKey } = useAuth();
  const { experimentsData, campaignsData, isLoading, error, setExperiments, setCampaigns } = useOptimizelyData();
  const [searchQuery, setSearchQuery] = useState('');
  const { filteredExperiments, filteredCampaigns, totalResults } = useSearchFilter(
    experimentsData,
    campaignsData,
    searchQuery
  );
  
  // Sort experiments by start date (oldest to newest)
  const sortedExperiments = [...filteredExperiments].sort((a, b) => {
    const dateA = a.earliest ? new Date(a.earliest) : new Date(0);
    const dateB = b.earliest ? new Date(b.earliest) : new Date(0);
    return dateA - dateB;
  });

  // Sort personalization campaigns by start date (oldest to newest)
  const sortedPersonalizationCampaigns = [...filteredCampaigns].sort((a, b) => {
    const dateA = a.earliest ? new Date(a.earliest) : new Date(0);
    const dateB = b.earliest ? new Date(b.earliest) : new Date(0);
    return dateA - dateB;
  });

  // Track which experiments and experiences are currently being refreshed
  const [refreshingExperiments, setRefreshingExperiments] = useState({});
  const [refreshingExperiences, setRefreshingExperiences] = useState({});
  // Track last refresh times 
  const [lastDataUpdate, setLastDataUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Get the most recent timestamp from localStorage
    const experimentTime = localStorage.getItem('experimentDataTime');
    const campaignTime = localStorage.getItem('campaignDataTime');
    
    if (experimentTime || campaignTime) {
      const times = [experimentTime, campaignTime].filter(Boolean).map(Number);
      const mostRecent = Math.max(...times);
      setLastDataUpdate(mostRecent);
    }
  }, [experimentsData, campaignsData]);

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      // Clear the cache
      localStorage.removeItem('experimentData');
      localStorage.removeItem('experimentDataTime');
      localStorage.removeItem('campaignData');
      localStorage.removeItem('campaignDataTime');

      // Fetch fresh data
      const freshExperiments = await fetchExperiments(projectId, apiKey);
      const freshCampaigns = await fetchCampaigns(projectId, apiKey);
      
      setExperiments(freshExperiments);
      setCampaigns(freshCampaigns);
      setLastDataUpdate(Date.now());
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to refresh a specific experiment
  const handleRefreshExperiment = async (experimentId) => {
    try {
      // Set this experiment as refreshing
      setRefreshingExperiments(prev => ({ ...prev, [experimentId]: true }));
      
      // Fetch only the results for this specific experiment
      const updatedResults = await getExperimentResults(experimentId, apiKey);
      
      // Create a deep copy of the current experiments data
      const updatedExperimentsData = JSON.parse(JSON.stringify(experimentsData));
      
      // Find and update the experiment in the A/B tests array
      const abTestIndex = updatedExperimentsData.a_b_tests.findIndex(exp => exp.id === experimentId);
      if (abTestIndex !== -1) {
        updatedExperimentsData.a_b_tests[abTestIndex].metrics = updatedResults.metrics;
      }
      
      // Find and update the experiment in the personalization campaigns array
      const campaignIndex = updatedExperimentsData.personalization_campaigns.findIndex(exp => exp.id === experimentId);
      if (campaignIndex !== -1) {
        updatedExperimentsData.personalization_campaigns[campaignIndex].metrics = updatedResults.metrics;
      }
      
      // Update the state with the modified data
      setExperiments(updatedExperimentsData);
    } catch (error) {
      console.error('Error refreshing experiment:', error);
    } finally {
      // Mark this experiment as no longer refreshing
      setRefreshingExperiments(prev => ({ ...prev, [experimentId]: false }));
    }
  };

  // Function to refresh a specific campaign experience
  const handleRefreshCampaignExperience = async (experienceId) => {
    try {
      // Set this experience as refreshing
      setRefreshingExperiences(prev => ({ ...prev, [experienceId]: true }));
      
      // Fetch only the results for this specific experience
      const updatedResults = await getExperimentResults(experienceId, apiKey);
      
      // Create a deep copy of the current experiments data
      const updatedExperimentsData = JSON.parse(JSON.stringify(experimentsData));
      
      // Find and update the experience in the personalization campaigns array
      const experienceIndex = updatedExperimentsData.personalization_campaigns.findIndex(exp => exp.experience_id === experienceId);
      if (experienceIndex !== -1) {
        updatedExperimentsData.personalization_campaigns[experienceIndex].metrics = updatedResults.metrics;
      }
      
      // Update the state with the modified data
      setExperiments(updatedExperimentsData);
    } catch (error) {
      console.error('Error refreshing campaign experience:', error);
    } finally {
      // Mark this experience as no longer refreshing
      setRefreshingExperiences(prev => ({ ...prev, [experienceId]: false }));
    }
  };

  // Show loading spinner when data is being fetched
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show error message if there's an error
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Show empty state if no data is available
  if (!experimentsData && !campaignsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Optimizely B2B Dashboard</h1>
        <EmptyState 
          message="No data available" 
          subMessage="Please check your API key and project ID"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Optimizely B2B Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Last updated: {formatLastUpdated(lastDataUpdate)}
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
              isRefreshing
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh All Data'}
          </button>
        </div>
      </div>
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalResults={totalResults}
      />

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">A/B Experiments</h2>
          <div className="grid grid-cols-1 gap-6">
            {sortedExperiments.length > 0 ? (
              sortedExperiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onRefresh={handleRefreshExperiment}
                  isRefreshing={refreshingExperiments[experiment.id] || false}
                />
              ))
            ) : (
              <EmptyState
                message="No experiments found"
                subMessage={searchQuery ? "Try adjusting your search terms" : "No experiments available"}
              />
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Campaigns</h2>
          <div className="grid grid-cols-1 gap-6">
            {sortedPersonalizationCampaigns.length > 0 ? (
              sortedPersonalizationCampaigns.map((campaign) => {
                const campaignExperiences = experimentsData?.personalization_campaigns?.filter(
                  (exp) => exp.campaign_id === campaign.id
                ) || [];
                return (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    experiences={campaignExperiences}
                    onRefresh={handleRefreshCampaignExperience}
                    refreshingExperiences={refreshingExperiences}
                  />
                );
              })
            ) : (
              <EmptyState
                message="No campaigns found"
                subMessage={searchQuery ? "Try adjusting your search terms" : "No campaigns available"}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}