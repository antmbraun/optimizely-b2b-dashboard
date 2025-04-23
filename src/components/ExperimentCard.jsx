import React from 'react';
import MetricsTable from './MetricsTable';

export default function ExperimentCard({ experiment, onRefresh, isRefreshing = false }) {
  // Calculate duration in days with error checking
  const startDate = experiment.earliest ? new Date(experiment.earliest) : null;
  const now = new Date();
  // JavaScript Date objects store time in milliseconds since Unix epoch (Jan 1, 1970)
  // We round down to nearest whole day
  const durationInDays = startDate ? Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) : null;

  // Calculate estimated time remaining
  const calculateEstimatedTimeRemaining = () => {
    if (!startDate || !experiment.metrics || experiment.metrics.length === 0) {
      return null;
    }

    // Get the first metric's results
    const metric = experiment.metrics[0];
    if (!metric.results) return null;

    // Calculate total samples across all variations
    const totalSamples = Object.values(metric.results).reduce((sum, res) => sum + res.samples, 0);
    
    // Calculate samples per day
    const samplesPerDay = totalSamples / durationInDays;
    
    // Get the p-value from our statistical significance calculation
    const statSig = calculateStatisticalSignificance(metric.results);
    const currentPValue = statSig.pValue;
    
    // If we're already significant, check if we've met the minimum duration
    if (currentPValue <= 0.15) {
      const minimumDaysRemaining = Math.max(0, 14 - durationInDays);
      return { 
        daysRemaining: minimumDaysRemaining, 
        completionPercentage: minimumDaysRemaining === 0 ? 100 : Math.round((durationInDays / 14) * 100), 
        statSig, 
        totalSamples, 
        samplesPerDay,
        isMinimumDuration: minimumDaysRemaining > 0
      };
    }
    
    // Estimate how many more samples we need to reach p < 0.15
    // This is a simplified calculation - in reality, it's more complex
    const estimatedAdditionalSamples = Math.ceil((totalSamples * (1 - currentPValue)) / 0.15);
    const estimatedDaysRemaining = Math.ceil(estimatedAdditionalSamples / samplesPerDay);
    
    // Calculate completion percentage
    const totalEstimatedSamples = totalSamples + estimatedAdditionalSamples;
    const completionPercentage = Math.min(Math.round((totalSamples / totalEstimatedSamples) * 100), 99);
    
    // Ensure minimum two-week duration
    const minimumDaysRemaining = Math.max(0, 14 - durationInDays);
    const finalDaysRemaining = Math.max(estimatedDaysRemaining, minimumDaysRemaining);
    
    return { 
      daysRemaining: finalDaysRemaining, 
      completionPercentage, 
      statSig, 
      totalSamples, 
      samplesPerDay,
      isMinimumDuration: finalDaysRemaining === minimumDaysRemaining
    };
  };

  // Calculate statistical significance using chi-square test
  const calculateStatisticalSignificance = (results) => {
    if (!results) return { isSignificant: false, pValue: 1, confidence: 0 };
    
    const variations = Object.values(results);
    if (variations.length < 2) return { isSignificant: false, pValue: 1, confidence: 0 };

    const baseline = variations.find(v => v.is_baseline);
    const variation = variations.find(v => !v.is_baseline);
    
    if (!baseline || !variation) return { isSignificant: false, pValue: 1, confidence: 0 };

    const n1 = baseline.samples;
    const n2 = variation.samples;
    const x1 = baseline.value;
    const x2 = variation.value;

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pPooled = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
    const z = Math.abs(p1 - p2) / se;
    const pValue = 2 * (1 - normalCDF(z));
    
    return { isSignificant: pValue < 0.15, pValue, confidence: (1 - pValue) * 100 };
  };

  // Normal cumulative distribution function
  const normalCDF = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) {
      prob = 1 - prob;
    }
    return prob;
  };

  const estimatedTimeRemaining = calculateEstimatedTimeRemaining();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-semibold text-white">{experiment.name}</h3>
            <p className="mt-1 text-gray-400">{experiment.description}</p>
          </div>
          <div className="text-sm text-gray-400 text-right w-80">
            {startDate ? (
              <>
                {estimatedTimeRemaining && (
                  <div className="mb-2 flex items-center justify-end space-x-1">
                    <p className="text-blue-400 font-medium text-base">
                      Est. {estimatedTimeRemaining.daysRemaining} days remaining ({estimatedTimeRemaining.completionPercentage}% complete)
                    </p>
                    <div className="group relative">
                      <svg className="h-4 w-4 text-gray-400 cursor-help" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute top-0 right-full mr-2 w-64 p-2 bg-gray-900 text-sm text-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left">
                        <p className="font-medium mb-1">Calculation factors</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Minimum duration: 14 days</li>
                          <li>Target p-value: 0.15</li>
                          <li>Traffic rate: {Math.round(estimatedTimeRemaining.samplesPerDay).toLocaleString()} visitors/day</li>
                          <li>Est. remaining visitors: {Math.round(estimatedTimeRemaining.samplesPerDay * estimatedTimeRemaining.daysRemaining).toLocaleString()}</li>
                        </ul>
                        <p className="mt-2 text-xs text-gray-400">
                          The completion percentage shows progress toward 85% statistical significance (p &lt; 0.15).
                          {estimatedTimeRemaining.isMinimumDuration && " This estimate includes the minimum required 14-day duration."} 
                          {" "}This is a simplified estimate based on current traffic patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p>Started: {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p>Running for: {durationInDays === 0 ? "<1 day" : `${durationInDays} days`}</p>
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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-col duration-200 text-sm font-medium shadow-sm"
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
          durationInDays={durationInDays}
        />
      </div>
    </div>
  );
} 