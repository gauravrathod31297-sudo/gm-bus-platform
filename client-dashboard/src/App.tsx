import { Routes, Route, Navigate } from 'react-router-dom'
import OTPLogin from './pages/OTPLogin'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Buses from './pages/Buses'
import RoutesList from './pages/Routes'
import Stops from './pages/Stops'
import Drivers from './pages/Drivers'
import TripHistory from './pages/TripHistory'
import LiveMap from './pages/LiveMap'

// Settings pages (all grouped)
import Profile from './pages/settings/Profile'
import Security from './pages/settings/Security'
import Company from './pages/settings/Company'
import Users from './pages/settings/Users'
import SmtpSettings from './pages/settings/SmtpSettings'
import VoiceSettings from './pages/settings/VoiceSettings'
import About from './pages/settings/About'
import SignUp from './pages/SignUp'
import LiveTracking from './pages/LiveTracking'

function RequireAuth({ children }: { children: any }) {
  const token = localStorage.getItem('client_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<OTPLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/buses" element={<RequireAuth><Buses /></RequireAuth>} />
      <Route path="/routes" element={<RequireAuth><RoutesList /></RequireAuth>} />
      <Route path="/stops" element={<RequireAuth><Stops /></RequireAuth>} />
      <Route path="/drivers" element={<RequireAuth><Drivers /></RequireAuth>} />
      <Route path="/trips" element={<RequireAuth><TripHistory /></RequireAuth>} />
      <Route path="/live" element={<RequireAuth><LiveMap /></RequireAuth>} />

      {/* Settings routes */}
      <Route path="/settings" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/settings/security" element={<RequireAuth><Security /></RequireAuth>} />
      <Route path="/settings/company" element={<RequireAuth><Company /></RequireAuth>} />
      <Route path="/settings/users" element={<RequireAuth><Users /></RequireAuth>} />
      <Route path="/settings/smtp" element={<RequireAuth><SmtpSettings /></RequireAuth>} />
      <Route path="/settings/voice" element={<RequireAuth><VoiceSettings /></RequireAuth>} />
      <Route path="/settings/about" element={<RequireAuth><About /></RequireAuth>} />

      {/* Legacy redirects */}
      <Route path="/users" element={<Navigate to="/settings/users" replace />} />
      <Route path="/smtp" element={<Navigate to="/settings/smtp" replace />} />
      <Route path="/voice" element={<Navigate to="/settings/voice" replace />} />
    </Routes>
  )
}
