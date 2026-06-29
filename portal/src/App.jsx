import { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import Dashboard from './Dashboard.jsx';

function App() {
  const [view, setView] = useState('landing');

  if (view === 'dashboard') {
    return <Dashboard onBack={() => setView('landing')} />;
  }
  return <LandingPage onEnter={() => setView('dashboard')} />;
}

export default App;
