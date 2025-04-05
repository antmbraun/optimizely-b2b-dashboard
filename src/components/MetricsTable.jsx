import React from 'react';

export default function MetricsTable({ metrics, shareableLink, onRefresh, isRefreshing = false }) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const getSignificanceColor = (isSignificant, liftStatus) => {
    if (isSignificant) {
      return liftStatus === 'better' ? 'text-green-400' : 'text-red-400';
    }
    return 'text-yellow-400';
  };

  const getSignificanceLabel = (isSignificant, liftStatus) => {
    if (isSignificant) {
      return liftStatus === 'better' ? 'Significant Improvement' : 'Significant Decline';
    }
    return 'Not Significant';
  };

  // Calculate statistical significance using chi-square test
  const calculateStatisticalSignificance = (results) => {
    // Check if results is undefined or null
    if (!results) return { isSignificant: false, pValue: 1, confidence: 0 };
    
    // Need at least two variations to compare
    const variations = Object.values(results);
    if (variations.length < 2) return { isSignificant: false, pValue: 1, confidence: 0 };

    // Find baseline and variation
    const baseline = variations.find(v => v.is_baseline);
    const variation = variations.find(v => !v.is_baseline);
    
    if (!baseline || !variation) return { isSignificant: false, pValue: 1, confidence: 0 };

    // Extract data
    const n1 = baseline.samples;
    const n2 = variation.samples;
    const x1 = baseline.value;
    const x2 = variation.value;

    // Calculate proportions
    const p1 = x1 / n1;
    const p2 = x2 / n2;
    
    // Calculate pooled proportion
    const pPooled = (x1 + x2) / (n1 + n2);
    
    // Calculate standard error
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
    
    // Calculate z-score
    const z = Math.abs(p1 - p2) / se;
    
    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - normalCDF(z));
    
    // Calculate confidence level
    const confidence = (1 - pValue) * 100;
    
    // Determine if significant (p < 0.05)
    const isSignificant = pValue < 0.05;
    
    return { isSignificant, pValue, confidence };
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

  const getOurSignificanceColor = (pValue) => {
    if (pValue <= 0.01) return 'text-green-400';
    if (pValue <= 0.05) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getOurSignificanceLabel = (pValue) => {
    if (pValue <= 0.01) return 'Highly Significant';
    if (pValue <= 0.05) return 'Significant';
    return 'Not Significant';
  };

  return (
    <section className="mt-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Metrics & Results</h2>
      <div className="mt-6 space-y-6">
        {metrics.map((metric) => {
          // Check if metric.results exists before using it
          const variations = metric.results ? Object.values(metric.results) : [];
          const statSig = metric.results ? calculateStatisticalSignificance(metric.results) : { isSignificant: false, pValue: 1, confidence: 0 };
          
          return (
            <div key={metric.event_id} className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                {metric.name}
              </h3>
              
              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Samples</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lift</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Optly Stat Sig</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Our Stat Sig</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-700 ${isRefreshing ? 'opacity-50' : ''}`}>
                    {Object.entries(metric.results || {}).map(([variationId, res]) => (
                      <tr key={variationId} className="hover:bg-gray-800 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300 font-medium">
                          {res.name ? res.name : 'Holdback'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{res.samples.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {(res.rate * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {res.lift ? (
                            <span className={`${res.lift.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {res.lift.value > 0 ? '+' : ''}{(res.lift.value * 100).toFixed(2)}%
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {res.lift ? (
                            <div className="flex items-center space-x-2">
                              <span className={`${getSignificanceColor(res.lift.is_significant, res.lift.lift_status)} font-medium`}>
                                {getSignificanceLabel(res.lift.is_significant, res.lift.lift_status)}
                              </span>
                              {res.lift.significance > 0 && (
                                <span className="text-gray-400 text-sm">
                                  ({res.lift.significance.toFixed(1)}% confidence)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {!res.is_baseline ? (
                            <div className="flex items-center space-x-2">
                              <span className={`${getOurSignificanceColor(statSig.pValue)} font-medium`}>
                                {getOurSignificanceLabel(statSig.pValue)}
                              </span>
                              <span className="text-gray-400 text-sm">
                                (p={statSig.pValue.toFixed(3)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Baseline</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        <div className="mt-4 flex justify-end space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`inline-flex items-center px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 hover:cursor-pointer transition-colors duration-200 text-sm font-medium shadow-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Results
            </button>
          )}
          {shareableLink && (
            <a
              href={shareableLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 hover:cursor-pointer transition-colors duration-200 text-sm font-medium shadow-sm"
            >
              View Full Results
            </a>
          )}
        </div>
      </div>
    </section>
  );
} 