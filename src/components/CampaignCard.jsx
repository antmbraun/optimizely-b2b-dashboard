import React from 'react';
import MetricsTable from './MetricsTable';

export default function CampaignCard({ campaign, experiences, onRefresh, refreshingExperiences = {} }) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
          <p className="mt-1 text-gray-400">{campaign.description}</p>
        </div>

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
                    <p className="mt-1 text-gray-400">{exp.description}</p>
                    
                    <MetricsTable 
                      metrics={exp.metrics} 
                      shareableLink={exp.shareable_link} 
                      onRefresh={onRefresh ? () => onRefresh(exp.experience_id) : undefined}
                      isRefreshing={isRefreshing}
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
    </div>
  );
} 