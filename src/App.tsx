import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Bio from './pages/Bio';
import PublicBio from './pages/PublicBio';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/p" element={<PublicBio />} />

        {/* Private Routes with Layout */}
        <Route path="/" element={<Layout><Calendar /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/finance" element={<Layout><Finance /></Layout>} />
        <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
        <Route path="/clients" element={<Layout><Clients /></Layout>} />
        <Route path="/bio" element={<Layout><Bio /></Layout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Layout><Calendar /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
