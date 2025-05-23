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
import Settings, { DEFAULT_MINIMUM_DURATION } from '../components/Settings';

export default function Home() {
  const { projectId, apiKey } = useAuth();
  const { experimentsData, campaignsData, isLoading, error, setExperiments, setCampaigns } = useOptimizelyData();
  const [searchQuery, setSearchQuery] = useState('');
  const [minimumDuration, setMinimumDuration] = useState(() => {
    const saved = localStorage.getItem('minimumDuration');
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_MINIMUM_DURATION;
    // Validate the saved value is within bounds
    return Math.min(Math.max(parsed, 7), 90);
  });
  const [showSettings, setShowSettings] = useState(false);
  const { filteredExperiments, filteredCampaigns, totalResults } = useSearchFilter(
    experimentsData || { a_b_tests: [], personalization_campaigns: [] },
    campaignsData || [],
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

  useEffect(() => {
    localStorage.setItem('minimumDuration', minimumDuration.toString());
  }, [minimumDuration]);

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

      // Update local storage with the new data
      localStorage.setItem('experimentData', JSON.stringify(updatedExperimentsData));
      localStorage.setItem('experimentDataTime', Date.now());
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

      // Update local storage with the new data
      localStorage.setItem('experimentData', JSON.stringify(updatedExperimentsData));
      localStorage.setItem('experimentDataTime', Date.now());
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
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Optimizely B2B Dashboard</h1>
        <ErrorMessage message={error} />
      </div>
    );
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
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </div>
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className={`${showSettings ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            totalResults={totalResults}
          />
        </div>
        {showSettings && (
          <div className="lg:col-span-1">
            <Settings 
              minimumDuration={minimumDuration}
              onMinimumDurationChange={setMinimumDuration}
            />
          </div>
        )}
      </div>

      {/* A/B Tests Section */}
      {sortedExperiments.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">A/B Tests</h2>
          <div className="space-y-6">
            {sortedExperiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                onRefresh={handleRefreshExperiment}
                isRefreshing={refreshingExperiments[experiment.id] || false}
                minimumDuration={minimumDuration}
              />
            ))}
          </div>
        </section>
      )}

      {/* Personalization Campaigns Section */}
      {sortedPersonalizationCampaigns.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Personalization Campaigns</h2>
          <div className="space-y-6">
            {sortedPersonalizationCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onRefresh={handleRefreshCampaignExperience}
                refreshingExperiences={refreshingExperiences}
                minimumDuration={minimumDuration}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}