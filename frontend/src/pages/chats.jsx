import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  const fetchData = async () => {
    try {
      const msgResponse = await api.get(`conversations/${id}/messages/`);
      setMessages(msgResponse.data);

      const convResponse = await api.get(`conversations/`);
      const currentConv = convResponse.data.find(c => c.id === parseInt(id));
      setConversation(currentConv);

      setLoading(false);
    } catch (err) {
      console.error("Erreur chargement:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const token = localStorage.getItem('token');
    const socketUrl = `ws://127.0.0.1:8000/ws/chat/${id}/?token=${token}`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => console.log("WebSocket connecté avec succès !");

    // FUSION DES DEUX LOGIQUES ONMESSAGE
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 1. GESTION DU STATUT (ONLINE/OFFLINE)
      if (data.type === 'user_status') {
        setConversation(prev => {
          if (prev && prev.other_user.id === data.user_id) {
            return {
              ...prev,
              other_user: { ...prev.other_user, is_online: data.is_online }
            };
          }
          return prev;
        });
        return;
      }

      // 2. GESTION DES MESSAGES
      const receivedMessage = data.message || data;
      const currentUser = localStorage.getItem('username');
      receivedMessage.is_mine = String(receivedMessage.sender_username) === String(currentUser);

      setMessages((prevMessages) => {
        if (receivedMessage.id && prevMessages.some(msg => msg.id === receivedMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, receivedMessage];
      });
    };

    socket.onclose = (e) => console.log("WebSocket déconnecté:", e.reason);
    socket.onerror = (err) => console.error("Erreur WebSocket détectée");

    return () => socket.close();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post(`conversations/${id}/messages/`, { content: newMessage });
      setNewMessage("");
    } catch (err) {
      console.error("Erreur envoi:", err.response?.data);
    }
  };

  if (loading) return <div className="container mt-4 text-center">Chargement...</div>;

  const otherUser = conversation?.other_user;

  return (
    <div className="container mt-4">
      {/* HEADER DU CHAT */}
      <div className="chat-header p-3 bg-white border rounded shadow-sm d-flex align-items-center mb-3">
        <div className="position-relative">
          <img
            src={otherUser?.avatar || 'https://via.placeholder.com/40'}
            className="rounded-circle border"
            width="45" height="45" alt="avatar"
          />
          {otherUser?.is_online && (
            <span
              className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
              style={{ width: '12px', height: '12px' }}
            ></span>
          )}
        </div>
        <div className="ms-3">
          <h6 className="mb-0 fw-bold">{otherUser?.username || "Chargement..."}</h6>
          <small className={otherUser?.is_online ? "text-success fw-bold" : "text-muted"}>
            {otherUser?.is_online ? "● En ligne" :
              (otherUser?.last_seen ? `Vu le ${new Date(otherUser.last_seen).toLocaleString()}` : "Hors ligne")}
          </small>
        </div>
      </div>

      {/* ZONE MESSAGES */}
      <div
        ref={scrollRef}
        className="chat-box bg-light p-3 rounded shadow-sm mb-3"
        style={{ height: "450px", overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted my-auto">Aucun message ici.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id || Math.random()} className={`mb-2 d-flex ${msg.is_mine ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`p-2 rounded shadow-sm ${msg.is_mine ? 'bg-primary text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: "70%", minWidth: "100px" }}>
                {!msg.is_mine && <small className="d-block fw-bold text-muted" style={{ fontSize: "0.7rem" }}>{msg.sender_username}</small>}
                <div style={{ wordBreak: "break-word" }}>{msg.content}</div>
                <small className={`d-block text-end mt-1 ${msg.is_mine ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: "0.6rem" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} className="d-flex gap-2 p-2 bg-white border rounded shadow-sm">
        <input
          type="text"
          className="form-control border-0 shadow-none"
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button type="submit" className="btn btn-primary px-4 rounded-pill">Envoyer</button>
      </form>
    </div>
  );
}