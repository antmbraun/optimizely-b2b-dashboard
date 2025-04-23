// Calculate statistical significance using two-tailed z-test with normal approximation
export const calculateStatisticalSignificance = (results) => {
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
  
  // Determine if significant (p < 0.15)
  const isSignificant = pValue < 0.15;
  
  return { isSignificant, pValue, confidence };
};

// Normal cumulative distribution function (CDF) using polynomial approximation
// This implementation uses the Abramowitz and Stegun approximation formula
const normalCDF = (x) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) {
    prob = 1 - prob;
  }
  return prob;
};

// Helper functions for determining significance colors and labels
export const getSignificanceColor = (isSignificant, liftStatus) => {
  if (isSignificant) {
    return liftStatus === 'better' ? 'text-green-400' : 'text-red-400';
  }
  return 'text-yellow-400';
};

export const getSignificanceLabel = (isSignificant, liftStatus) => {
  if (isSignificant) {
    return liftStatus === 'better' ? 'Significant Improvement' : 'Significant Decline';
  }
  return 'Not Significant';
};

export const getOurSignificanceColor = (pValue) => {
  if (pValue <= 0.05) return 'text-green-400';
  if (pValue <= 0.15) return 'text-yellow-400';
  return 'text-red-400';
};

export const getOurSignificanceLabel = (pValue) => {
  if (pValue <= 0.05) return 'Highly Significant';
  if (pValue <= 0.15) return 'Significant';
  return 'Not Significant';
}; 