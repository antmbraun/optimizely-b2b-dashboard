import { useMemo } from 'react';

/**
 * Custom hook for filtering experiments and campaigns based on search query
 * @param {Object} experimentsData - The experiments data object
 * @param {Array} campaignsData - The campaigns data array
 * @param {string} searchQuery - The search query string
 * @returns {Object} Filtered experiments and campaigns
 */
export default function useSearchFilter(experimentsData, campaignsData, searchQuery) {
  // Filter experiments based on search query
  const filteredExperiments = useMemo(() => {
    if (!experimentsData?.a_b_tests) return [];
    if (!searchQuery) return experimentsData.a_b_tests;
    
    const query = searchQuery.toLowerCase();
    
    return experimentsData.a_b_tests.filter(exp => {
      // Check experiment name and description
      if (exp.name.toLowerCase().includes(query) || 
          (exp.description && exp.description.toLowerCase().includes(query))) {
        return true;
      }
      
      // Check metric names
      if (exp.metrics && exp.metrics.some(metric => 
          metric.name.toLowerCase().includes(query))) {
        return true;
      }
      
      // Check variation names
      if (exp.variations && exp.variations.some(variation => 
          variation.name.toLowerCase().includes(query))) {
        return true;
      }
      
      return false;
    });
  }, [experimentsData, searchQuery]);

  // Filter personalization campaigns based on search query
  const filteredPersonalizationCampaigns = useMemo(() => {
    if (!experimentsData?.personalization_campaigns) return [];
    if (!searchQuery) return experimentsData.personalization_campaigns;
    
    const query = searchQuery.toLowerCase();
    
    return experimentsData.personalization_campaigns.filter(exp => {
      // Check experiment name and description
      if (exp.name.toLowerCase().includes(query) || 
          (exp.description && exp.description.toLowerCase().includes(query))) {
        return true;
      }
      
      // Check metric names
      if (exp.metrics && exp.metrics.some(metric => 
          metric.name.toLowerCase().includes(query))) {
        return true;
      }
      
      // Check variation names
      if (exp.variations && exp.variations.some(variation => 
          variation.name.toLowerCase().includes(query))) {
        return true;
      }
      
      return false;
    });
  }, [experimentsData, searchQuery]);

  // Filter campaigns based on search query
  // This needs to also check if any of its experiences match the search query
  const filteredCampaigns = useMemo(() => {
    if (!campaignsData) return [];
    if (!searchQuery) return campaignsData;
    
    const query = searchQuery.toLowerCase();
    
    return campaignsData.filter(campaign => {
      // Check campaign name and description
      if (campaign.name.toLowerCase().includes(query) || 
          (campaign.description && campaign.description.toLowerCase().includes(query))) {
        return true;
      }
      
      // Check if any of the campaign's experiences match the search query
      const campaignExperiences = experimentsData?.personalization_campaigns?.filter(
        exp => exp.campaign_id === campaign.id
      ) || [];
      
      return campaignExperiences.some(exp => 
        exp.name.toLowerCase().includes(query) || 
        (exp.description && exp.description.toLowerCase().includes(query)) ||
        // Check metric names in experiences
        (exp.metrics && exp.metrics.some(metric => 
          metric.name.toLowerCase().includes(query))) ||
        // Check variation names in experiences
        (exp.variations && exp.variations.some(variation => 
          variation.name.toLowerCase().includes(query)))
      );
    });
  }, [campaignsData, experimentsData, searchQuery]);

  // Calculate total results - include experiences in the count
  const totalResults = filteredExperiments.length + 
                      filteredCampaigns.length + 
                      (searchQuery ? filteredPersonalizationCampaigns.length : 0);

  return {
    filteredExperiments,
    filteredCampaigns,
    filteredPersonalizationCampaigns,
    totalResults
  };
} 