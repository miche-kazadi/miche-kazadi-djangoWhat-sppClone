import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../api/axios';
import UsersList from "../component/usersList";
// Remplace l'ancienne ligne par celle-ci :
import ProfileView from "../component/ProfileView";



export default function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AJOUT ICI : Les deux états pour gérer la vue et l'utilisateur choisi
  const [view, setView] = useState('messages');
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await api.get('conversations/');
        setConversations(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Impossible de charger les conversations.");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // AJOUT ICI : La fonction qui reçoit l'utilisateur cliqué
  const handleContactClick = (user) => {
    setSelectedUser(user);
    setView('profile');
  };

  const startConversation = async (userId) => {
    try {
      // On appelle ta route Django : path('conversations/start/')
      const response = await api.post('conversations/start/', { user_id: userId });

      // Une fois la conversation créée (id reçu), on redirige vers le chat
      navigate(`/chat/${response.data.id}`);
    } catch (err) {
      console.error("Erreur lors de la création de la conversation", err);
      alert("Impossible de démarrer la discussion.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        {/* COLONNE GAUCHE : Liste des contacts */}
        <div className="col-md-3 border-end">
          <h5 className="fw-bold mb-3">Contacts</h5>
          <div className="shadow-sm p-2 bg-light rounded" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <UsersList onContactClick={handleContactClick} />
          </div>
        </div>

        {/* COLONNE DROITE : Zone dynamique */}
        <div className="col-md-7">
          {view === 'messages' ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white shadow-sm rounded border">
                <div>
                  <h3 className="fw-bold mb-0">Messages</h3>
                  <small className="text-muted">{conversations.length} discussions actives</small>
                </div>
                <div className="d-flex gap-2">
                  <button onClick={() => navigate('/profile')} className="btn btn-light border rounded-circle" style={{ width: "45px", height: "45px" }}>👤</button>
                  <button className="btn btn-primary rounded-pill px-4 shadow-sm">+ Nouveau</button>
                </div>
              </div>

              {error && <div className="alert alert-danger shadow-sm">{error}</div>}

              <div className="list-group shadow-sm">
                {conversations.length === 0 ? (
                  <div className="list-group-item text-center py-5 text-muted">Aucune discussion en cours.</div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className="list-group-item list-group-item-action d-flex align-items-center py-3 px-3 border-start-0 border-end-0"
                    >
                      {/* --- DEBUT DU BLOC AVATAR AJOUTÉ --- */}
                      {conv.other_user?.avatar ? (
                        <img
                          src={conv.other_user.avatar}
                          alt={conv.other_user.username}
                          className="rounded-circle shadow-sm"
                          style={{ width: "45px", height: "45px", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: "45px", height: "45px", fontWeight: "bold", fontSize: "1.2rem" }}>
                          {conv.other_user?.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      {/* --- FIN DU BLOC AVATAR --- */}

                      <div className="ms-3 flex-grow-1 overflow-hidden text-start">
                        <h6 className="mb-0 fw-bold">{conv.other_user?.username || "Inconnu"}</h6>
                        <div className="text-muted text-truncate small">
                          {conv.last_message ? conv.last_message.content : "Cliquez pour envoyer un message"}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="bg-white shadow-sm rounded border p-4">
              <ProfileView
                user={selectedUser}
                onBack={() => setView('messages')}
                onStartChat={() => startConversation(selectedUser.id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
