// === Données globales ===
let courses = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');

const elements = {
  grid: document.getElementById('coursesGrid'),
  search: document.getElementById('searchInput'),
  
  // Modal Elements
  modal: document.getElementById('courseModal'),
  modalTitle: document.getElementById('modalTitle'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  chaptersList: document.getElementById('chaptersList'),
  contentArea: document.getElementById('contentArea'),
  toggleFav: document.getElementById('toggleFav'),
  closeModalBtn: document.getElementById('closeModalBtn'), // New button in footer
  
  globalProgress: document.getElementById('globalProgress'),
  themeToggle: document.getElementById('themeToggle'),
  toastContainer: document.getElementById('toastContainer')
};

// === Chargement initial ===
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  setupTheme();
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  if (elements.grid) {
    initHomePage();
  }
}

function initHomePage() {
  elements.grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1; text-align:center; padding:3rem;">Chargement des cours...</div>';
  
  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      courses = data;
      renderCourses();
      updateGlobalProgress();
      setupEventListeners();
    })
    .catch(err => {
      elements.grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1; text-align:center;">
          <h3>⚠️ Erreur de chargement</h3>
          <p>Assurez-vous de lancer ce projet via un serveur local (Live Server).</p>
        </div>`;
    });
}

// === Événements ===
function setupEventListeners() {
  if (!elements.grid) return;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.filter-btn.active').classList.remove('active');
      e.target.classList.add('active');
      renderCourses();
    });
  });

  if (elements.search) {
    elements.search.addEventListener('input', () => renderCourses());
  }
  
  if (elements.modal) {
    // Both X icon and "Fermer" text button
    elements.modal.querySelector('.close-icon').addEventListener('click', closeModal);
    if(elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    elements.modal.addEventListener('click', e => e.target === elements.modal && closeModal());
  }
}

// === Rendu des cours (Grid) ===
function renderCourses() {
  if (!elements.grid) return;

  const search = elements.search.value.toLowerCase();
  const filter = document.querySelector('.filter-btn.active').dataset.filter;

  const filtered = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search) ||
                         course.description.toLowerCase().includes(search);
    const matchesFilter = filter === 'all' ||
                         course.language === filter ||
                         (filter === 'favorites' && favorites.includes(course.id));
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    elements.grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:4rem; color:var(--gray);">
        <div style="font-size:3rem; margin-bottom:1rem;">🔍</div>
        <h3>Aucun résultat trouvé</h3>
        <p>Essayez d'autres mots-clés ou changez les filtres.</p>
      </div>`;
    return;
  }

  elements.grid.innerHTML = filtered.map(course => createCourseCard(course)).join('');
}

function createCourseCard(course) {
  const prog = getCourseProgress(course.id);
  const isFav = favorites.includes(course.id);

  return `
    <article class="course-card" onclick="openCourse(${course.id})">
      <div class="card-header">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
           <span class="badge ${course.level}">${formatLevel(course.level)}</span>
           ${isFav ? '<span class="heart-icon active">❤️</span>' : ''}
        </div>
        <h3 class="card-title">${course.title}</h3>
        <p class="card-desc">${course.description}</p>
      </div>
      <div class="card-footer">
        <span class="lang" style="font-weight:600; font-size:0.85rem; color:var(--gray);">${course.language.toUpperCase()}</span>
        <span style="font-size:0.9rem; font-weight:700; color:var(--accent)">
          ${prog.percent}%
        </span>
      </div>
      <div class="card-progress-overlay">
        <div class="card-progress-fill" style="width:${prog.percent}%"></div>
      </div>
    </article>
  `;
}

// === OPEN COURSE LOGIC (NEW SPLIT VIEW) ===
let currentCourseId = null;

function openCourse(id) {
  currentCourseId = id;
  const course = courses.find(c => c.id === id);
  if (!course) return;

  const prog = getCourseProgress(id);
  const isFav = favorites.includes(id);

  elements.modalTitle.textContent = course.title;
  updateModalProgress(prog.percent);
  updateFavButton(isFav);
  
  elements.toggleFav.onclick = () => toggleFavorite(id);

  // Render Sidebar List
  renderChapterList(course, prog);
  
  // Reset content area
  elements.contentArea.innerHTML = `
    <div class="content-placeholder">
      <span class="icon">👈</span>
      <h3>Sélectionnez un chapitre</h3>
      <p>Commencez votre apprentissage en cliquant sur un chapitre.</p>
    </div>
  `;

  elements.modal.showModal();
  document.body.style.overflow = 'hidden';
}

function renderChapterList(course, prog) {
  elements.chaptersList.innerHTML = course.chapters.map((chapter, i) => `
    <li class="${i === -1 ? 'active-chapter' : ''}" id="chap-li-${i}">
      <div class="chapter-item">
        <input type="checkbox" 
               ${prog.completed.includes(i) ? 'checked' : ''} 
               onclick="event.stopPropagation(); toggleChapter(${course.id}, ${i}, this.checked)">
        <span onclick="loadChapterContent('${chapter.replace(/'/g, "\\'")}', ${i})">${chapter}</span>
      </div>
    </li>
  `).join('');
}

// === Display Content (Mock) ===
window.loadChapterContent = function(chapterTitle, index) {
  // Highlight active chapter in sidebar
  document.querySelectorAll('.chapters-nav li').forEach(li => li.classList.remove('active-chapter'));
  const activeLi = document.getElementById(`chap-li-${index}`);
  if(activeLi) activeLi.classList.add('active-chapter');

  // Generate fake content based on title
  elements.contentArea.innerHTML = `
    <div class="chapter-content animation-fade-in">
      <span class="badge beginner" style="margin-bottom:1rem; display:inline-block;">Chapitre ${index + 1}</span>
      <h2>${chapterTitle}</h2>
      <p>Bienvenue dans ce module de formation. Dans cette section, nous allons explorer en profondeur les concepts fondamentaux de <strong>${chapterTitle}</strong>.</p>
      
      <div class="highlight-box">
        💡 <strong>Concept Clé :</strong> Comprendre ${chapterTitle} est essentiel pour maîtriser la suite du cours.
      </div>
      
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam.</p>
      
      <h3>Points à retenir</h3>
      <ul style="margin-left:1.5rem; margin-bottom:1.5rem; color:var(--text);">
        <li>Les bases fondamentales de ce sujet.</li>
        <li>Comment l'appliquer dans des cas réels.</li>
        <li>Les erreurs communes à éviter.</li>
      </ul>

      <p>N'oubliez pas de cocher la case dans le menu de gauche une fois que vous avez terminé cette lecture !</p>
    </div>
  `;
}

function closeModal() {
  elements.modal.close();
  document.body.style.overflow = '';
  renderCourses();
}

function updateModalProgress(percent) {
  elements.progressFill.style.width = percent + '%';
  elements.progressText.textContent = percent + '%';
  if(percent === 100) {
    elements.progressFill.style.backgroundColor = '#10b981';
    elements.progressText.textContent = "🎉 100%";
  }
}

// === Progression Logic ===
window.toggleChapter = function(courseId, chapterIndex, checked) {
  if (!progress[courseId]) progress[courseId] = { completed: [], percent: 0 };

  const set = new Set(progress[courseId].completed);
  checked ? set.add(chapterIndex) : set.delete(chapterIndex);
  progress[courseId].completed = Array.from(set);

  const course = courses.find(c => c.id === courseId);
  const percent = Math.round((set.size / course.chapters.length) * 100);
  progress[courseId].percent = percent;

  localStorage.setItem('courseProgress', JSON.stringify(progress));
  
  updateModalProgress(percent);
  updateGlobalProgress();

  if (percent === 100 && checked) {
    showToast(`Bravo ! Vous avez terminé "${course.title}" !`, 'success');
  }
}

function getCourseProgress(id) {
  return progress[id] || { completed: [], percent: 0 };
}

function updateGlobalProgress() {
  if (!elements.globalProgress) return;
  let total = 0, done = 0;
  courses.forEach(c => {
    total += c.chapters.length;
    if (progress[c.id]) done += progress[c.id].completed.length;
  });
  elements.globalProgress.textContent = `${done} / ${total}`;
}

// === Favoris & Toasts ===
function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  let isFav = false;
  if (index === -1) {
    favorites.push(id);
    isFav = true;
    showToast('Ajouté aux favoris', 'success');
  } else {
    favorites.splice(index, 1);
    showToast('Retiré des favoris', 'info');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavButton(isFav);
}

function updateFavButton(isFav) {
  elements.toggleFav.innerHTML = isFav 
    ? '❤️ Retirer' 
    : '🤍 Favoris';
  
  elements.toggleFav.style.background = isFav ? 'rgba(16, 185, 129, 0.1)' : 'transparent';
  elements.toggleFav.style.color = isFav ? 'var(--accent)' : 'var(--text)';
  elements.toggleFav.style.borderColor = isFav ? 'var(--accent)' : 'var(--border)';
}

function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = type === 'success' ? `✅ ${message}` : `ℹ️ ${message}`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards'; 
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// === Thème ===
function toggleTheme() {
  if (!elements.themeToggle) return;
  const isDark = document.documentElement.classList.toggle('dark');
  elements.themeToggle.innerHTML = isDark ? '<span class="icon">☀️</span>' : '<span class="icon">🌙</span>';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function setupTheme() {
  if (!elements.themeToggle) return;
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    elements.themeToggle.innerHTML = '<span class="icon">☀️</span>';
  } else {
    elements.themeToggle.innerHTML = '<span class="icon">🌙</span>';
  }
  elements.themeToggle.onclick = toggleTheme;
}

function formatLevel(level) {
  const map = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };
  return map[level] || level;
}