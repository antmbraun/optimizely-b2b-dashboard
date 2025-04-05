import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { apiKey: storedApiKey, projectId: storedProjectId, setApiKey, setProjectId } = useAuth();
  const [apiKey, updateApiKeyInput] = useState(storedApiKey || '');
  const [projectId, updateProjectIdInput] = useState(storedProjectId || '');

  const handleLogin = (e) => {
    e.preventDefault();
    setApiKey(apiKey);
    setProjectId(projectId);
  };

  return (
    <div className="flex justify-center items-center h-screen bng-gradient-to-r from-gray-900 via-gray-800 to-gray-900 animate-fadeIn">
      <div className="w-full max-w-md p-8 md:bg-gray-800 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-200">
          Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="text"
            placeholder="Optimizely API Key"
            className="w-full p-3 text-gray-100 placeholder-gray-500 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={apiKey}
            onChange={(e) => updateApiKeyInput(e.target.value)}
            required
            aria-required="true"
          />
          <input
            type="text"
            placeholder="Optimizely Project ID"
            className="w-full p-3 text-gray-100 placeholder-gray-500 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={projectId}
            onChange={(e) => updateProjectIdInput(e.target.value)}
            required
            aria-required="true"
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors font-semibold text-white rounded-md shadow cursor-pointer"
          >
            Save details
          </button>
        </form>
      </div>
    </div>
  );
}