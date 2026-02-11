import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import ProtectedRoute from './component/protectroot';
import ConversationList from './pages/ConversationList';
// Importe ton composant qui affiche les messages (ex: Chats.jsx)
import Chats from './pages/chats';
import Profile from './pages/profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Liste des conversations */}
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <ConversationList />
            </ProtectedRoute>
          }
        />

        {/* AJOUTE CETTE ROUTE ICI : La page de chat spécifique */}
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          }
        />

        {/* Redirection intelligente : si l'URL est inconnue, on va au login */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
          <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;