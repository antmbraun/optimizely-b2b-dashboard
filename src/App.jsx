import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  const { apiKey, projectId, setApiKey, setProjectId } = useAuth();

  useEffect(() => {
    document.body.classList.add('bg-gray-900');
    return () => {
      document.body.classList.remove('bg-gray-900');
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={apiKey && projectId ? <Home /> : 
        <Login
          apiKey={apiKey}
          projectId={projectId}
          setApiKey={setApiKey} 
          setProjectId={setProjectId} />} />
    </Routes>
  )
}

export default App
