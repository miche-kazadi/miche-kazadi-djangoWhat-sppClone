import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function StoriesBar() {
  const [stories, setStories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // État pour la barre (0 à 100)
  const [seenStories, setSeenStories] = useState([]); // Pour changer la couleur du cercle

  useEffect(() => {
    fetchStories();
  }, []);

  // --- LOGIQUE DU TIMER (5 SECONDES) ---
  useEffect(() => {
    let timer;
    if (selectedGroup) {
      setProgress(0); // Reset la barre à chaque nouvelle photo
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextStory(); // Passe à la suite quand c'est fini
            return 0;
          }
          return prev + 2; // Vitesse de remplissage (50 steps * 100ms = 5s)
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [selectedGroup, currentIndex]);

  const fetchStories = async () => {
    try {
      const res = await api.get('stories/');
      setStories(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      await api.post('stories/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchStories();
    } catch (err) { alert("Erreur upload"); } finally { setUploading(false); }
  };

  const nextStory = () => {
    // On marque la story actuelle comme "vue"
    if (selectedGroup) {
      const storyId = selectedGroup.stories[currentIndex].id;
      if (!seenStories.includes(storyId)) {
        setSeenStories([...seenStories, storyId]);
      }
    }

    if (currentIndex < selectedGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const currentGroupIndex = stories.findIndex(g => g.username === selectedGroup.username);
      if (currentGroupIndex < stories.length - 1) {
        setSelectedGroup(stories[currentGroupIndex + 1]);
        setCurrentIndex(0);
      } else {
        setSelectedGroup(null);
      }
    }
  };

  const prevStory = (e) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      const currentGroupIndex = stories.findIndex(g => g.username === selectedGroup.username);
      if (currentGroupIndex > 0) {
        const prevGroup = stories[currentGroupIndex - 1];
        setSelectedGroup(prevGroup);
        setCurrentIndex(prevGroup.stories.length - 1);
      }
    }
  };

  // Fonction pour savoir si un groupe a été entièrement vu
  const isGroupSeen = (group) => {
    return group.stories.every(s => seenStories.includes(s.id));
  };

  return (
    <div className="p-3 mb-3 bg-white rounded shadow-sm">
      <div className="d-flex align-items-center overflow-auto" style={{ gap: "15px" }}>

        {/* BOUTON MOI */}
        <div className="text-center" style={{ minWidth: "70px" }}>
          <label htmlFor="story-upload" style={{ cursor: "pointer" }}>
            <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
              <span className="h3 mb-0 text-primary">+</span>
            </div>
            <input type="file" id="story-upload" hidden onChange={handleUpload} disabled={uploading} />
          </label>
          <small className="d-block text-muted">Statut</small>
        </div>

        {/* LISTE DES UTILISATEURS */}
        {stories.map((group, idx) => {
          const viewed = isGroupSeen(group); // Vérifie si tout est vu
          return (
            <div key={idx} className="text-center" style={{ minWidth: "70px", cursor: "pointer" }}
              onClick={() => { setSelectedGroup(group); setCurrentIndex(0); }}>
              <div className={`rounded-circle p-1 border border-3 ${viewed ? 'border-secondary opacity-50' : 'border-primary'}`}
                style={{ width: "65px", height: "65px", transition: '0.3s' }}>
                <img src={group.stories[0].image} className="rounded-circle w-100 h-100" style={{ objectFit: "cover" }} />
              </div>
              <small className={`d-block mt-1 ${viewed ? 'text-muted' : 'fw-bold'}`}>{group.username}</small>
            </div>
          );
        })}
      </div>

      {/* --- VIEWER AVEC TIMER --- */}
      {selectedGroup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'black', zIndex: 9999 }} onClick={() => setSelectedGroup(null)}>

          {/* BARRE DE PROGRESSION (TIMER) */}
          <div className="position-absolute top-0 start-0 w-100 p-2 d-flex" style={{ gap: "4px" }}>
            {selectedGroup.stories.map((_, i) => (
              <div key={i} className="flex-grow-1 bg-secondary rounded" style={{ height: "4px", overflow: "hidden" }}>
                <div className="bg-white h-100" style={{
                  width: i === currentIndex ? `${progress}%` : i < currentIndex ? "100%" : "0%",
                  transition: i === currentIndex ? "none" : "width 0.3s"
                }}></div>
              </div>
            ))}
          </div>

          <button className="btn btn-link text-white position-absolute start-0 h-100 px-4" onClick={prevStory}>❮</button>

          <div className="text-center text-white" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2">@{selectedGroup.username}</p>
            <img src={selectedGroup.stories[currentIndex].image} className="rounded" style={{ maxHeight: "85vh", maxWidth: "95vw" }} />
          </div>

          <button className="btn btn-link text-white position-absolute end-0 h-100 px-4" onClick={(e) => nextStory(e)}>❯</button>
        </div>
      )}
    </div>
  );
}