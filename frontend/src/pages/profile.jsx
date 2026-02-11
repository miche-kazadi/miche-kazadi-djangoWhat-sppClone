import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Profile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    api.get('conversations/') 
      .then(res => {
        if (res.data.length > 0) {
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Choisis d'abord une photo !");

    const formData = new FormData();
    formData.append('avatar', selectedFile); 

    try {
      const response = await api.post('profile/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
        },
      });
      alert("Photo de profil mise à jour avec succès !");
      console.log("Nouveau profil :", response.data);
    } catch (err) {
      console.error("Erreur lors de l'upload :", err.response?.data);
      alert("L'upload a échoué.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 card shadow p-4 text-center">
          <h2 className="mb-4">Mon Profil</h2>

          <div className="mb-4">
            {preview ? (
              <img
                src={preview}
                alt="Aperçu"
                className="rounded-circle border"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
            ) : (
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center border" style={{ width: "150px", height: "150px" }}>
                <span className="text-muted">Pas de photo</span>
              </div>
            )}
          </div>

          <div className="mb-3">
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