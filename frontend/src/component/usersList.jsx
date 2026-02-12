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
            {user.avatar ? (
              <img
                src={user.avatar || 'https://via.placeholder.com/150'}
                alt={user.username}
                className="rounded-circle shadow border"
              style={{ width: "36px", height: "36px", objectFit: "cover", fontSize: "2rem" }}
              />
              
              
            ) : (
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center "
                style={{ width: "36px", height: "37px", objectFit: "cover" }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              
            )}
          

          {/* Texte avec gestion du débordement */}
          <div className="ms-3 overflow-hidden">
            <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: "150px" }}>
              {user.username}
            </h6>
            <small className={user?.is_online ? "text-success fw-bold" : "text-muted"}>
              {user?.is_online ? "● En ligne" : (user?.last_seen ? `vu le ${new Date(user.last_seen).toDateString()}` :"Hors ligne")}
            </small>


          </div>
        </button>
      ))}
    </div>
  );
}