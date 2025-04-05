import React from 'react';

export default function EmptyState({ message = "No results found." }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <p className="text-gray-400">{message}</p>
    </div>
  );
} 