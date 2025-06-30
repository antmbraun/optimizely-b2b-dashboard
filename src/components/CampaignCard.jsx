import React, { useState } from 'react';
import MetricsTable from './MetricsTable';
import { calculateStatisticalSignificance, getOurSignificanceColor, getOurSignificanceLabel } from '../utils/statisticalSignificance';

export default function CampaignCard({ campaign, onRefresh, refreshingExperiences = {}, minimumDuration = 14 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Get experiences for this campaign
  const experiences = campaign.experiences || [];

  // Extract key metrics for collapsed view from first experience
  const getCollapsedMetrics = () => {
    if (experiences.length === 0 || !experiences[0].metrics || experiences[0].metrics.length === 0) {
      return { lift: null, statSig: null };
    }

    const firstExperience = experiences[0];
    const firstMetric = firstExperience.metrics[0];
    
    if (!firstMetric.results) {
      return { lift: null, statSig: null };
    }

    // Get the first non-baseline variation for lift
    const variations = Object.values(firstMetric.results);
    const testVariation = variations.find(v => !v.is_baseline);
    const lift = testVariation?.lift?.value || null;

    // Calculate our statistical significance
    const statSig = calculateStatisticalSignificance(firstMetric.results);

    return { lift, statSig };
  };

  const { lift, statSig } = getCollapsedMetrics();

  return (
    <div 
      className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-gray-500 transition-all duration-200"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-semibold text-white">{campaign.name}</h3>
                <svg 
                  className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="mt-1 text-gray-400 max-w-3xl text-sm sm:text-base">{campaign.description}</p>
            </div>
          </div>
          
          {/* Collapsed view summary */}
          {!isExpanded && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              {lift !== null && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">Lift:</span>
                  <span className={`font-medium ${lift > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {lift > 0 ? '+' : ''}{(lift * 100).toFixed(2)}%
                  </span>
                </div>
              )}
              {statSig && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400">Stat Sig:</span>
                  <span className={`font-medium ${getOurSignificanceColor(statSig.pValue)}`}>
                    {getOurSignificanceLabel(statSig.pValue)}
                  </span>
                  <span className="text-gray-400">
                    (p={statSig.pValue.toFixed(3)})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://app.optimizely.com/v2/projects/${campaign.project_id}/campaigns/${campaign.id}/experiences`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
              >
                Edit Campaign
              </a>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">Experiences</h4>
              <div className="space-y-6">
                {experiences.length > 0 ? (
                  experiences.map((exp) => {
                    const isRefreshing = refreshingExperiences[exp.experience_id] || false;
                    
                    return (
                      <div key={exp.experience_id || `exp-${Math.random()}`} className="bg-gray-700 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-white">{exp.name}</h5>
                        <p className="mt-1 text-gray-400 max-w-3xl">{exp.description}</p>
                        
                        <MetricsTable 
                          metrics={exp.metrics} 
                          shareableLink={exp.shareable_link} 
                          onRefresh={onRefresh ? () => onRefresh(exp.experience_id) : undefined}
                          isRefreshing={isRefreshing}
                          minimumDuration={minimumDuration}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400">No experiences available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 