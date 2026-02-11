import React from 'react';

// 1. On ajoute onStartChat dans les props pour recevoir la fonction
export default function ProfileView({ user, onBack, onStartChat }) {
  if (!user) return null;

  return (
    <div className="text-center p-4">
      <button className="btn btn-outline-secondary btn-sm mb-3" onClick={onBack}>
        ← Retour aux messages
      </button>

      <div className="mt-3">
        {/* 2. On affiche l'image si elle existe, sinon la lettre */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="rounded-circle shadow border"
            style={{ width: "120px", height: "120px", objectFit: "cover" }}
          />
        ) : (
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto shadow"
            style={{ width: "100px", height: "100px", fontSize: "2rem" }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}

        <h2 className="mt-3 fw-bold">{user.username}</h2>
        <p className="text-muted">{user.email || "Pas d'email renseigné"}</p>

        <hr />

        {/* 3. LE BOUTON MANQUANT EST ICI */}
        <button
          className="btn btn-primary w-5 rounded-pill py-2 shadow-sm mt-3"
          onClick={onStartChat}
        >
          Démarrer une conversation
        </button>

        <div className="mt-3">
          <small className="badge bg-light text-success border border-success">
            Utilisateur vérifié
          </small>
        </div>
      </div>
    </div>
  );
}