import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('message/login/', {
        username: credentials.username,
        password: credentials.password
      });

      const token = response.data.token || response.data.key;
      if (token) {
        localStorage.setItem('token', token);
        // --- AJOUTE CETTE LIGNE ICI ---
        localStorage.setItem('username', credentials.username);
        // ------------------------------
        console.log("Redirection en cours...");
        navigate('/conversations');
      }
    } catch (err) {
      console.error(err);
      setError("Identifiants incorrects ou erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4 card shadow p-4">
          <h2 className="text-center mb-4">Connexion</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <input
              name="username"
              type="text"
              className="form-control mb-3"
              placeholder="Nom d'utilisateur"
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              className="form-control mb-3"
              placeholder="Mot de passe"
              onChange={handleChange}
              required
            />
            <button disabled={loading} type="submit" className="btn btn-primary w-100">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}