// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // On change 'accessToken' par 'token' pour correspondre à ton Login.jsx
  const token = localStorage.getItem('token');

  // Si le token n'existe pas, on redirige vers /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Sinon, on affiche le composant (les conversations)
  return children;
}