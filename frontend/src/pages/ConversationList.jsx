import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../api/axios';
import UsersList from "../component/usersList";
import ProfileView from "../component/ProfileView";
import StoriesBar from "../component/StoriesBar";
import Contacts from '../component/addcontact';

export default function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('messages');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await api.get('conversations/');
        setConversations(Array.isArray(response.data) ? response.data : []);
      } catch (err) { setError("Erreur chargement."); } finally { setLoading(false); }
    };
    fetchConversations();
  }, []);

  const handleContactClick = (user) => { setSelectedUser(user); setView('profile'); };

  const startConversation = async (userId) => {
    try {
      const response = await api.post('conversations/start/', { user_id: userId });
      navigate(`/chat/${response.data.id}`);
      setIsModalOpen(false);
    } catch (err) { alert("Erreur."); }
  };

  if (loading) return <div className="d-flex justify-content-center p-5 text-success">Chargement...</div>;

  return (
    <div className="container-fluid p-0">
      {isModalOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
          <div className="card bg-dark-whatsapp border-0 shadow-lg" style={{ width: '90%', maxWidth: '450px' }}>
            <div className="card-header d-flex justify-content-between align-items-center border-0">
              <h5 className="text-custom-main">Nouveau contact</h5>
              <button className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
            </div>
            <div className="card-body"><Contacts onSelectContact={startConversation} /></div>
          </div>
        </div>
      )}
      <div className="row g-0">
        <div className="col-md-3 bg-dark-whatsapp border-end border-custom p-3">
          <h5 className="text-custom-main">Contacts</h5>
          <UsersList onContactClick={handleContactClick} />
        </div>
        <div className="col-md-9 p-4">
          {view === 'messages' ? (
            <>
              <StoriesBar />
              <div className="bg-dark-whatsapp p-4 rounded-3 mb-4">
                <h3 className="text-custom-main">Messages</h3>
                <button onClick={() => setIsModalOpen(true)} className="btn text-white rounded-pill px-4" style={{ backgroundColor: '#00a884' }}>+ Nouveau</button>
              </div>
              <div className="d-flex flex-column">
                {conversations.map(conv => (
                  <button key={conv.id} onClick={() => navigate(`/chat/${conv.id}`)} className="btn text-start p-3 border-bottom border-custom bg-dark-whatsapp text-custom-main">
                    <h6 className="fw-bold">{conv.other_user?.username}</h6>
                    <small className="text-custom-muted">{conv.last_message?.content || "Démarrer..."}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-dark-whatsapp p-4 rounded-3 text-custom-main">
              <ProfileView user={selectedUser} onBack={() => setView('messages')} onStartChat={() => startConversation(selectedUser.id)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}