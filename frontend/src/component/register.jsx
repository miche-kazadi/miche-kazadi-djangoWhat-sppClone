import React, { useState } from 'react';
import {useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Efface l'erreur si l'utilisateur commence à corriger
    if (error) setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);

      // Succès : on informe et on redirige
      alert("Bienvenue sur WhatsApp Clone !");
      navigate('/');
      window.location.reload();

    } catch (err) {
      // Capture d'erreurs plus précise
      const errorMsg = err.response?.data?.error || "Une erreur est survenue lors de l'inscription.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h2 className="text-center mb-4 fw-bold text-primary">WhatsApp Clone</h2>
              <h5 className="text-center mb-4 text-muted">Créer un compte</h5>

              {error && <div className="alert alert-danger animate__animated animate__shakeX">{error}</div>}

              <form onSubmit={handleRegister}>
                {['username', 'email', 'password', 'confirmPassword'].map((field) => (
                  <div className="mb-3" key={field}>
                    <label className="form-label text-capitalize">
                      {field === 'confirmPassword' ? 'Confirmer le mot de passe' : field}
                    </label>
                    <input
                      type={field.includes('password') ? "password" : (field === 'email' ? "email" : "text")}
                      name={field}
                      className="form-control"
                      placeholder={`Entrez votre ${field}`}
                      value={formData[field]}
                      onChange={handleChange}
                      required={field !== 'email'}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-bold mt-2"
                  disabled={loading || !formData.username || !formData.password}
                >
                  {loading ? (
                    <span><i className="spinner-border spinner-border-sm me-2"></i>Chargement...</span>
                  ) : "S'inscrire"}
                </button>
              </form>

              <div className="text-center mt-4">
                <span className="text-muted">Déjà un compte ? </span>
                <Link to="/login" className="text-decoration-none">Se connecter</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}