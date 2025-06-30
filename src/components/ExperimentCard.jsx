import React, { useState } from 'react';
import MetricsTable from './MetricsTable';
import { calculateStatisticalSignificance, getOurSignificanceColor, getOurSignificanceLabel } from '../utils/statisticalSignificance';

export default function ExperimentCard({ experiment, onRefresh, isRefreshing = false, minimumDuration = 14 }) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    
    // Calculate minimum duration remaining
    const minimumDaysRemaining = Math.max(0, minimumDuration - durationInDays);
    
    // Calculate days needed for statistical significance
    let statSigDaysRemaining = 0;
    if (currentPValue > 0.15) {
      const pValueRatio = currentPValue / 0.15;
      const estimatedAdditionalSamples = Math.ceil(totalSamples * (pValueRatio - 1) * 0.5);
      statSigDaysRemaining = Math.ceil(estimatedAdditionalSamples / samplesPerDay);
    }
    
    // If minimum duration is the limiting factor, use that for calculations
    const isMinimumDurationLimiting = minimumDaysRemaining >= statSigDaysRemaining;
    const daysRemaining = isMinimumDurationLimiting ? minimumDaysRemaining : statSigDaysRemaining;
    
    // Calculate completion percentage based on the limiting factor
    let completionPercentage;
    if (isMinimumDurationLimiting) {
      // If minimum duration is limiting, base completion on that
      completionPercentage = Math.min(99, Math.round((durationInDays / minimumDuration) * 100));
    } else {
      // If statistical significance is limiting, use the previous calculation
      const minimumDurationProgress = Math.min(1, durationInDays / minimumDuration) * 0.5;
      const statSigProgress = Math.max(0, Math.min(1, (1 - currentPValue) / 0.85)) * 0.5;
      completionPercentage = Math.min(99, Math.round((minimumDurationProgress + statSigProgress) * 100));
    }
    
    return { 
      daysRemaining, 
      completionPercentage, 
      statSig, 
      totalSamples, 
      samplesPerDay,
      isMinimumDuration: isMinimumDurationLimiting
    };
  };

  const estimatedTimeRemaining = calculateEstimatedTimeRemaining();

  // Extract key metrics for collapsed view
  const getCollapsedMetrics = () => {
    if (!experiment.metrics || experiment.metrics.length === 0) {
      return { lift: null, statSig: null };
    }

    const firstMetric = experiment.metrics[0];
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
      <div className="p-6">
        {/* Always visible header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold text-white">{experiment.name}</h3>
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
            <p className="mt-1 text-gray-400 max-w-3xl">{experiment.description}</p>
            
            {/* Collapsed view metrics */}
            {!isExpanded && (
              <div className="mt-3 flex items-center space-x-6 text-sm">
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

          {/* Right side info - always visible */}
          <div className="text-sm text-gray-400 text-right w-80 space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* Time estimates and dates */}
            {startDate ? (
              <>
                {estimatedTimeRemaining && (
                  <div className="flex items-center justify-end space-x-1">
                    <p className="text-blue-400 font-medium text-base">
                      Est. {estimatedTimeRemaining.daysRemaining} days remaining ({estimatedTimeRemaining.completionPercentage}% complete)
                    </p>
                    <div className="relative inline-block group">
                      <svg className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute top-0 right-full mr-2 w-64 p-2 bg-gray-900 text-sm text-gray-300 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left">
                        <p className="font-medium mb-1">Calculation factors</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Minimum duration: {minimumDuration} days</li>
                          <li>Target p-value: 0.15</li>
                          <li>Traffic rate: {Math.round(estimatedTimeRemaining.samplesPerDay).toLocaleString()} visitors/day</li>
                          <li>Est. remaining visitors: {Math.round(estimatedTimeRemaining.samplesPerDay * estimatedTimeRemaining.daysRemaining).toLocaleString()}</li>
                        </ul>
                        <p className="mt-2 text-xs text-gray-400">
                          The completion percentage shows progress toward 85% statistical significance (p &lt; 0.15).
                          {estimatedTimeRemaining.isMinimumDuration && " This estimate includes the minimum required " + minimumDuration + "-day duration."} 
                          {" "}This is a simplified estimate based on current traffic patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p>Started: {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p>Running for: {durationInDays === 0 ? "<1 day" : `${durationInDays} days`} 
                  {durationInDays > 30 ? ' 🔴' : durationInDays > 15 ? ' 🟡' : ' 🟢'}
                </p>
              </>
            ) : (
              <p className="text-yellow-400">Start date not available</p>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            <MetricsTable 
              metrics={experiment.metrics} 
              shareableLink={experiment.shareable_link} 
              onRefresh={onRefresh ? () => onRefresh(experiment.id) : undefined}
              isRefreshing={isRefreshing}
            />
          </div>
        )}
      </div>
    </div>
  );
} 