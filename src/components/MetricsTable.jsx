import React from 'react';
import { 
  calculateStatisticalSignificance,
  getSignificanceColor,
  getSignificanceLabel,
  getOurSignificanceColor,
  getOurSignificanceLabel
} from '../utils/statisticalSignificance';

export default function MetricsTable({ metrics, shareableLink, onRefresh, isRefreshing = false, durationInDays }) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

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
                <table className="w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">Variation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">
                        {metric.type === 'personalization' ? 'Sessions & Conversions' : 'Visitors & Conversions'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">
                        <div className="flex items-center space-x-1">
                          <span>Conversion Rate</span>
                          <div className="group relative">
                            <svg className="h-4 w-4 text-gray-400 cursor-help" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute top-0 right-full mr-2 w-72 p-2 bg-gray-800 font-normal text-sm text-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] text-left normal-case border border-gray-700 overflow-visible">
                              <p>From Optimizely</p>
                              <p className="text-xs text-gray-400">The conversion rate for this variation, with the relative difference compared to the baseline shown in parentheses.</p>
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">
                        <a 
                          href={shareableLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        >
                          Optly Stat Sig
                        </a>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/6">
                        <div className="flex items-center space-x-1">
                          <span>Our Stat Sig</span>
                          <div className="group relative">
                            <svg className="h-4 w-4 text-gray-400 cursor-help" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute top-0 right-full mr-2 w-72 p-2 bg-gray-900 text-sm text-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left normal-case">
                              <p className="mb-1">Statistical method:</p>
                              <p className="text-xs text-gray-400 mb-2">Two-tailed z-test with normal approximation</p>
                              <ul className="list-disc list-inside ml-4 text-xs">
                                <li>p &lt;= 0.05: Highly significant (95% confidence)</li>
                                <li>p &lt;= 0.15: Significant (85% confidence)</li>
                                <li>p &gt; 0.15: Not significant</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-700 ${isRefreshing ? 'opacity-50' : ''}`}>
                    {Object.entries(metric.results || {})
                      .sort(([, a], [, b]) => {
                        // Sort baseline first, then alphabetically by name
                        if (a.is_baseline) return -1;
                        if (b.is_baseline) return 1;
                        return (a.name || '').localeCompare(b.name || '');
                      })
                      .map(([variationId, res]) => (
                      <tr key={variationId} className="hover:bg-gray-800 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300 font-medium">
                          {res.name ? res.name : 'Holdback'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          <div className="flex flex-col">
                            <span>{res.value.toLocaleString()} conversions</span>
                            <span className="text-sm text-gray-400">
                              {res.samples.toLocaleString()} {metric.type === 'personalization' ? 'sessions' : 'visitors'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                          <div className="flex flex-col">
                            <span>{((res.value / res.samples) * 100).toFixed(2)}%</span>
                            {res.lift && (
                              <span className={`text-sm ${res.lift.value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ({res.lift.value > 0 ? '+' : ''}{(res.lift.value * 100).toFixed(2)}% lift)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {res.lift ? (
                            <div className="flex flex-col">
                              <span className={`${getSignificanceColor(res.lift.is_significant, res.lift.lift_status)} font-medium`}>
                                {getSignificanceLabel(res.lift.is_significant, res.lift.lift_status)}
                              </span>
                              <span className="text-sm text-gray-400">
                                {res.lift.significance === 0 ? '0' : res.lift.significance?.toFixed(1)}% confidence
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {!res.is_baseline ? (
                            <div className="flex flex-col">
                              <span className={`${getOurSignificanceColor(statSig.pValue)} font-medium`}>
                                {getOurSignificanceLabel(statSig.pValue)}
                              </span>
                              <span className="text-sm text-gray-400">
                                p={statSig.pValue.toFixed(3)} ({Math.round((1 - statSig.pValue) * 100)}% confidence)
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