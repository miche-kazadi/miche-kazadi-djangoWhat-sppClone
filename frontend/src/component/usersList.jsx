import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function UsersList() {
  const [loadingId, setLoadingId] = useState(null); // État pour le chargement
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("users/")
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
    }, []);
    
      const startConversation = async (userId) => {
        try {
          setLoadingId(userId); // Active le spinner pour cet utilisateur
          const res = await api.post("conversations/start/", { user_id: userId });
          navigate(`/chat/${res.data.id}`);
        } catch (err) {
          console.error("Erreur création conversation", err);
        } finally {
          setLoadingId(null); // Désactive le spinner
        }
      };

  return (
    <div className="list-group list-group-flush shadow-sm rounded">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => startConversation(user.id)}
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
              En ligne
            </small>
          </div>
        </button>
      ))}
    </div>
  );
}


// ... tes autres imports


 
