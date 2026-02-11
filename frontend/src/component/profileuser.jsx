import React from 'react';

const ProfileView = ({ user, onBack }) => {
  if (!user) return null;

  return (
    <div className="profile-detail-view" style={{ padding: '20px', textAlign: 'center' }}>
      <button
        onClick={onBack}
        style={{ float: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
      >
        ← Retour
      </button>

      <div style={{ marginTop: '60px' }}>
        <img
          src={user.avatar || 'https://via.placeholder.com/150'}
          alt={user.username}
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #007bff' }}
        />
        <h1 style={{ margin: '15px 0 5px' }}>{user.username}</h1>
        <p style={{ color: user.is_online ? '#28a745' : '#6c757d', fontWeight: 'bold' }}>
          {user.is_online ? '● En ligne' : '○ Hors ligne'}
        </p>

        <hr style={{ margin: '30px 0', opacity: 0.2 }} />

        <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <p><strong>Email:</strong> {user.email || 'Non renseigné'}</p>
          <p><strong>Nom:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Bio:</strong> Passionné de tech et de discussions passionnantes.</p>
        </div>

        <button
          style={{
            marginTop: '30px', padding: '10px 25px', backgroundColor: '#007bff',
            color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer'
          }}
        >
          Démarrer une conversation
        </button>
      </div>
    </div>
  );
};

