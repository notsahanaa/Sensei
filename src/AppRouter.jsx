import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import ForgotPassword from './components/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import CreateProject from './pages/CreateProject'
import Project from './pages/Project'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<App />} />

        {/* Auth Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Create Project */}
        <Route path="/create-project" element={<CreateProject />} />

        {/* Project Page */}
        <Route path="/project/:id" element={<Project />} />

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
