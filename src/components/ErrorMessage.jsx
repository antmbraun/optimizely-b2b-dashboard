import React from 'react';

export default function ErrorMessage({ message, title = "Error" }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">{title}</div>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
} 