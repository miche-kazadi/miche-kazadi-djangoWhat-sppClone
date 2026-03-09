import React, { useEffect, useState } from "react";
import api from "../api/axios";

function Contacts({ onSelectContact }) {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await api.get("contacts/");
        setContacts(res.data);
      } catch (error) {
        console.error("Erreur de chargement des contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter((contact) =>
    contact.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center p-3 text-muted">Chargement...</div>;

  return (
    <div className="d-flex flex-column h-100">
      {/* Barre de recherche stylisée */}
      <div className="px-3 mb-2">
        <input
          type="text"
          className="form-control text-white border-0 shadow-none"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            backgroundColor: "#b8c9d3ff",
            borderRadius: "20px",
            paddingLeft: "15px"
          }}
        />
      </div>

      {/* Liste de contacts avec survol */}
      <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "350px" }}>
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className="d-flex align-items-center w-100 p-3 border-0 bg-transparent text-white contact-hover"
            >
              <img
                src={contact.avatar || "/default.png"}
                alt={contact.username}
                className="rounded-circle"
                style={{ width: "45px", height: "45px", objectFit: "cover", border: "1px solid #333" }}
              />
              <div className="ms-3 text-start">
                <div className="fw-bold">{contact.username}</div>
                <small className="text-muted">{contact.username}</small>
              </div>
            </button>
          ))
        ) : (
          <div className="text-muted text-center p-3">Aucun contact trouvé</div>
        )}
      </div>
    </div>
  );
}

export default Contacts;