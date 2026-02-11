import { NavLink, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import PricesPage from './pages/PricesPage'
import MapPage from './pages/MapPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">MI</div>
          <div>
            <div className="brand-title">Mandi-Insights</div>
            <div className="brand-subtitle">Market intelligence for APMCs</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/prices" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Prices
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Map
          </NavLink>
        </nav>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/prices" element={<PricesPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
