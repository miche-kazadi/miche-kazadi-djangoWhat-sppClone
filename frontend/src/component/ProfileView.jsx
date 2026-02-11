import React from 'react';

export default function ProfileView({ user, onBack }) {
  if (!user) return null;

  return (
    <div className="text-center p-4">
      <button className="btn btn-outline-secondary btn-sm mb-3" onClick={onBack}>
        ← Retour aux messages
      </button>
      <div className="mt-3">
        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto shadow"
          style={{ width: "100px", height: "100px", fontSize: "2rem" }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h2 className="mt-3 fw-bold">{user.username}</h2>
        <p className="text-muted">{user.email || "Pas d'email renseigné"}</p>
        <hr />
        <div className="badge bg-success p-2">Utilisateur vérifié</div>
      </div>
    </div>
  );
}