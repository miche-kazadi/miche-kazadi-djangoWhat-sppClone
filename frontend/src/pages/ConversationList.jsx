import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../api/axios';
import UsersList from "../component/usersList";

export default function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
            <UsersList />
          </div>
        </div>

        {/* COLONNE DROITE : Liste des conversations */}
        <div className="col-md-7">
          {/* ENTÊTE AMÉLIORÉE BOOTSTRAP */}
          <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white shadow-sm rounded border">
            <div>
              <h3 className="fw-bold mb-0">Messages</h3>
              <small className="text-muted">{conversations.length} discussions actives</small>
            </div>

            <div className="d-flex gap-2">
              {/* Bouton Profil circulaire */}
              <button
                onClick={() => navigate('/profile')}
                className="btn btn-light border rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "45px", height: "45px" }}
                title="Mon Profil"
              >
                👤
              </button>

              {/* Bouton Nouveau Message */}
              <button className="btn btn-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2">
                <span className="fw-bold">+</span> Nouveau
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger shadow-sm">{error}</div>}

          <div className="list-group shadow-sm">
            {conversations.length === 0 ? (
              <div className="list-group-item text-center py-5 text-muted">
                Aucune discussion en cours.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="list-group-item list-group-item-action d-flex align-items-center py-3 px-3 border-start-0 border-end-0"
                >
                  {/* Avatar avec gestion Image vs Lettre */}
                  <div className="position-relative" style={{ flexShrink: 0 }}>
                    {conv.other_user?.avatar ? (
                      <img
                        src={conv.other_user.avatar}
                        className="rounded-circle"
                        style={{ width: "55px", height: "55px", objectFit: "cover" }}
                        alt="avatar"
                      />
                    ) : (
                      <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: "55px", height: "55px" }}>
                        {conv.other_user?.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle"></span>
                  </div>

                  {/* Contenu textuel */}
                  <div className="ms-3 flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold text-truncate">
                        {conv.other_user?.username || "Utilisateur inconnu"}
                      </h6>
                      <small className="text-muted small ms-2">
                        {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : ""}
                      </small>
                    </div>
                    <div className="text-muted text-truncate small">
                      {conv.last_message ? conv.last_message.content : "Démarrer une discussion"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}