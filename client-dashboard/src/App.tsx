import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Buses from './pages/Buses'
import RoutesPage from './pages/RoutesPage'
import LiveMap from './pages/LiveMap'
import Settings from './pages/Settings'

function App() {
  const token = localStorage.getItem('client_token')
  const Guard = ({ children }: { children: JSX.Element }) =>
    token ? children : <Navigate to="/login" />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Guard><Dashboard /></Guard>} />
      <Route path="/buses" element={<Guard><Buses /></Guard>} />
      <Route path="/routes" element={<Guard><RoutesPage /></Guard>} />
      <Route path="/live" element={<Guard><LiveMap /></Guard>} />
      <Route path="/settings" element={<Guard><Settings /></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
