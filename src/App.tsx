import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Bio from './pages/Bio';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/bio" element={<Bio />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
