import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import Clients from './pages/Clients'

function App() {
  const token = localStorage.getItem('admin_token')
  const Guard = ({ children }: { children: JSX.Element }) =>
    token ? children : <Navigate to="/login" />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Guard><Dashboard /></Guard>} />
      <Route path="/requests" element={<Guard><Requests /></Guard>} />
      <Route path="/clients" element={<Guard><Clients /></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
