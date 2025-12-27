import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Refills from './pages/Refills'
import Expenses from './pages/Expenses'
import Analytics from './pages/Analytics'
import Reminders from './pages/Reminders'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/refills" element={<Refills />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reminders" element={<Reminders />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
