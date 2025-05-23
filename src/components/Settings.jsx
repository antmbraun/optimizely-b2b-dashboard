import React, { useState, useEffect } from 'react';

export const DEFAULT_MINIMUM_DURATION = 14;
const MIN_ALLOWED_DURATION = 7;  // Minimum 1 week
const MAX_ALLOWED_DURATION = 90; // Maximum 3 months

export default function Settings({ minimumDuration, onMinimumDurationChange }) {
  const [inputValue, setInputValue] = useState(minimumDuration.toString());
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInputValue(minimumDuration.toString());
  }, [minimumDuration]);

  const handleDurationChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleBlur = async () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      setInputValue(minimumDuration.toString());
      return;
    }
    
    // Clamp the value between MIN and MAX
    const clampedValue = Math.min(Math.max(numValue, MIN_ALLOWED_DURATION), MAX_ALLOWED_DURATION);
    setInputValue(clampedValue.toString());
    
    // Show saving state
    setIsSaving(true);
    
    // Simulate a small delay to show the saving state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update the value
    onMinimumDurationChange(clampedValue);
    
    // Hide saving state and show success
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = async () => {
    // Show saving state
    setIsSaving(true);
    
    // Simulate a small delay to show the saving state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update the value
    onMinimumDurationChange(DEFAULT_MINIMUM_DURATION);
    setInputValue(DEFAULT_MINIMUM_DURATION.toString());
    
    // Hide saving state and show success
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // This will trigger the handleBlur function
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <label htmlFor="minimumDuration" className="block text-sm font-medium text-gray-300">
              Minimum experiment duration
            </label>
            <div className="group relative">
              <svg 
                className="h-4 w-4 text-gray-400 cursor-help" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <p className="mb-1">14 days is recommended to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Account for weekly traffic patterns</li>
                  <li>Ensure statistical significance</li>
                  <li>Reduce impact of outliers</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id="minimumDuration"
              value={inputValue}
              onChange={handleDurationChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className={`bg-gray-700 text-white rounded-md px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <span className="text-sm text-gray-400">
              {minimumDuration === DEFAULT_MINIMUM_DURATION ? (
                "Default: 14 days"
              ) : (
                "days"
              )}
            </span>
          </div>
          {minimumDuration !== DEFAULT_MINIMUM_DURATION && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className={`mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Reset to Default
            </button>
          )}
          {minimumDuration < DEFAULT_MINIMUM_DURATION && (
            <p className="mt-1 text-sm text-yellow-400">
              Warning: Less than recommended 14-day minimum
            </p>
          )}
          {isSaving && (
            <div className="mt-2 text-sm text-blue-400 flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving settings...</span>
            </div>
          )}
          {showSuccess && !isSaving && (
            <div className="mt-2 text-sm text-green-400 fade-in-out">
              Settings saved and applied
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .fade-in-out {
          animation: fadeInOut 3s ease-in-out;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
} 