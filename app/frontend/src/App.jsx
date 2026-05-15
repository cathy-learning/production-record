import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import RecordFormPage from './pages/RecordFormPage'
import RecordPrintPage from './pages/RecordPrintPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/records/new" element={<RecordFormPage />} />
      <Route path="/records/:id/edit" element={<RecordFormPage />} />
      <Route path="/records/:id/print" element={<RecordPrintPage />} />
    </Routes>
  )
}

export default App
