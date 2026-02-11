import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

// AJOUT DE LA PROP onContactClick ICI
export default function UsersList({ onContactClick }) {
  const [loadingId, setLoadingId] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("users/")
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="list-group list-group-flush shadow-sm rounded">
      {users.map((user) => (
        <button
          key={user.id}
          // CHANGEMENT ICI : On appelle onContactClick au lieu de startConversation
          onClick={() => onContactClick(user)}
          className="list-group-item list-group-item-action d-flex align-items-center py-3 border-bottom"
          style={{ cursor: 'pointer' }}
        >
          {/* Avatar avec cercle Bootstrap */}
          <div
            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
            style={{ width: "45px", height: "45px", flexShrink: 0 }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>

          {/* Texte avec gestion du débordement */}
          <div className="ms-3 overflow-hidden">
            <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: "150px" }}>
              {user.username}
            </h6>
            <small className="text-muted d-block text-truncate">
              {user.is_online ? "En ligne" : "Hors ligne"}
            </small>
          </div>
        </button>
      ))}
    </div>
  );
}