import React from 'react';
import MetricsTable from './MetricsTable';

export default function ExperimentCard({ experiment, onRefresh, isRefreshing = false }) {
  // Calculate duration in days with error checking
  const startDate = experiment.earliest ? new Date(experiment.earliest) : null;
  const now = new Date();
  // JavaScript Date objects store time in milliseconds since Unix epoch (Jan 1, 1970)
  // We round down to nearest whole day
  const durationInDays = startDate ? Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-semibold text-white">{experiment.name}</h3>
            <p className="mt-1 text-gray-400">{experiment.description}</p>
          </div>
          <div className="text-sm text-gray-400 text-right w-48">
            {startDate ? (
              <>
                <p>Started: {startDate.toLocaleDateString()}</p>
                <p>Running for: {durationInDays} days</p>
              </>
            ) : (
              <p className="text-yellow-400">Start date not available</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`https://app.optimizely.com/v2/projects/${experiment.project_id}/experiments/${experiment.id}/variations`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
          >
            Edit Experiment
          </a>
          {experiment.variations.map((variation) => {
            const previewLink = variation.actions[0]?.share_link;
            return (
              <a
                key={variation.variation_id}
                href={previewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm font-medium shadow-sm"
              >
                Preview: {variation.name}
              </a>
            );
          })}
        </div>
        
        <MetricsTable 
          metrics={experiment.metrics} 
          shareableLink={experiment.shareable_link} 
          onRefresh={onRefresh ? () => onRefresh(experiment.id) : undefined}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
} 