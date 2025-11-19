import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Layout from './components/Layout';
import Upload from './pages/Upload';
import Record from './pages/Record';
import Transcripts from './pages/Transcripts';
import TranscriptDetail from './pages/TranscriptDetail';
import './App.css';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard/upload" />} />
          <Route path="upload" element={<Upload />} />
          <Route path="record" element={<Record />} />
          <Route path="transcripts" element={<Transcripts />} />
          <Route path="transcripts/:id" element={<TranscriptDetail />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
