import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Profile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les données au montage du composant
  useEffect(() => {
    api.get('users/me/') 
      .then(res => {
        setUserData(res.data);
        // Si l'utilisateur a déjà un avatar en base de données
        if (res.data.avatar) {
          setPreview(res.data.avatar);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement profil (vérifie ton URL Django):", err);
        setLoading(false);
      });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // URL temporaire pour voir l'image avant de cliquer sur sauvegarder
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Choisis d'abord une photo !");

    const formData = new FormData();
    formData.append('avatar', selectedFile); 

    try {
      const response = await api.post('profile/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      alert("Photo de profil mise à jour avec succès !");
      setUserData(response.data);
      setPreview(response.data.avatar); 
      setSelectedFile(null); 
    } catch (err) {
      console.error("Erreur lors de l'upload :", err.response?.data);
      alert("L'upload a échoué.");
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement du profil...</div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 card shadow p-4 text-center">
          <h2 className="mb-4">Mon Profil</h2>
          
          {userData && (
            <div className="mb-3">
               <h4 className="text-primary">@{userData.username}</h4>
            </div>
          )}

          <div className="mb-4">
            {preview ? (
              <img
                src={preview}
                alt="Profil"
                className="rounded-circle border"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
            ) : (
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center border" style={{ width: "150px", height: "150px" }}>
                <span className="text-muted">Pas de photo</span>
              </div>
            )}
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-bold">Changer la photo</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <button
            onClick={handleUpload}
            className="btn btn-primary w-100"
            disabled={!selectedFile}
          >
            Sauvegarder ma photo
          </button>
        </div>
      </div>
    </div>
  );
}