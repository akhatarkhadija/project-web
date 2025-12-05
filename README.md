# 📚 Cours Code – Plateforme d’apprentissage interactive

**Cours Code** est une mini-plateforme web moderne pour apprendre le développement (C, Python, Web, etc.) avec un système de progression, de favoris et un thème clair/sombre.   

---

## 🚀 Aperçu

- Page principale : liste de cours avec filtres par langage (C, Python, Web) et barre de recherche.   
- Page “À propos” : présentation de la mission, du groupe IT Info et de la FSSM. :contentReference[oaicite:2]{index=2}  
- Ouverture d’un cours dans une **modale** avec :
  - Liste des chapitres à gauche.
  - Contenu simulé du chapitre à droite.
  - Suivi de progression par cours.
  - Système de favoris.   

Le design utilise un style **glassmorphism**, responsive et un mode sombre/clair.

---

## 🧩 Structure du projet

```text
.
├── index.html      # Page principale avec la grille de cours et la modale
├── about.html      # Page À propos (mission, FSSM, Group IT Info)
├── styles.css      # Styles globaux (UI, thème, modale, responsive)
├── app.js          # Logique côté client (fetch, favoris, progression, thème)
└── data.json       # Données des cours (titre, niveau, chapitres, etc.)
