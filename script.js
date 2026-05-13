/* =============================================
   DECKS
============================================= */
const DECKS = [
  { id:'animais',    name:'Animais',        icon:'&#129409;', words:['Elefante','Tubarao','Papagaio','Coruja','Cobra','Gorila','Pinguim','Camelo','Hipopotamo','Pantera'] },
  { id:'comidas',    name:'Comidas',        icon:'&#127829;', words:['Pizza','Sushi','Lasanha','Hamburguer','Tapioca','Feijoada','Risoto','Ramen','Brigadeiro','Pastel'] },
  { id:'esportes',   name:'Esportes',       icon:'&#9917;',   words:['Futebol','Natacao','Judo','Volei','Ciclismo','Boxe','Basquete','Tenis','Polo Aquatico','Esgrima'] },
  { id:'filmes',     name:'Filmes e Series',icon:'&#127916;', words:['Matrix','Titanic','Breaking Bad','Avatar','Inception','Friends','Stranger Things','Interstellar','Coco','Parasita'] },
  { id:'profissoes', name:'Profissoes',     icon:'&#128188;', words:['Astronauta','Cirurgiao','Arqueologo','Diplomata','Sommelier','Mergulhador','Relojoeiro','Ilusionista','Cartografo','Chocolatier'] },
  { id:'lugares',    name:'Lugares',        icon:'&#127757;', words:['Amazonia','Dubai','Antartida','Veneza','Toquio','Machu Picchu','Las Vegas','Islandia','Maldivas','Petra'] },
  { id:'objetos',    name:'Objetos',        icon:'&#128273;', words:['Telescopio','Bussola','Metronomo','Caleidoscopio','Sextante','Termometro','Periscopio','Abajur','Relogio de Sol','Pendulo'] },
  { id:'custom',     name:'Personalizado',  icon:'&#9999;',   words:[], custom:true }
];

/* =============================================
   STATE
============================================= */
const state = {
  players: [], impostorCount: 1, selectedDeck: null,
  assignments: [], currentReveal: 0, currentTurn: 0
};

const SWIPE_THRESHOLD = 85;
const MAX_TILT = 20;
let drag = { active: false, startX: 0, startY: 0, curX: 0, revealed: false };

/* =============================================
   INIT
============================================= */
function init() {
  const grid = document.getElementById('deck-grid');
  grid.innerHTML = DECKS.map(d =>
    '<div class="deck-card" data-id="' + d.id + '" onclick="selectDeck(\'' + d.id + '\')">' +
    '<div class="deck-icon">' + d.icon + '</div>' +
    '<div class="deck-name">' + d.name + '</div>' +
    '<div class="deck-count">' + (d.custom ? 'Sua escolha' : d.words.length + ' palavras') + '</div>' +
    '</div>'
  ).join('');
}

function selectDeck(id) {
  state.selectedDeck = id;
  document.querySelectorAll('.deck-card').forEach(c => c.classList.remove('selected'));
  document.querySelector('.deck-card[data-id="' + id + '"]').classList.add('selected');
}

/* =============================================
   PLAYERS
============================================= */
function addPlayer() {
  const inp = document.getElementById('new-player-name');
  const name = inp.value.trim();
  if (!name) return;
  if (state.players.includes(name)) { toast('Nome ja existe'); return; }
  state.players.push(name);
  inp.value = '';
  renderPlayers();
}
function removePlayer(idx) {
  state.players.splice(idx, 1);
  renderPlayers();
}
function renderPlayers() {
  document.getElementById('player-list').innerHTML = state.players.map((p, i) =>
    '<div class="player-item">' +
    '<span class="num">' + (i+1) + '</span>' +
    '<span class="name">' + p + '</span>' +
    '<button class="remove" onclick="removePlayer(' + i + ')">&times;</button>' +
    '</div>'
  ).join('');
}

/* =============================================
   START GAME
============================================= */
function startGame() {
  const players = state.players;
  const impostors = parseInt(document.getElementById('impostor-count').value || 1);
  const deckId = state.selectedDeck;

  if (players.length < 3) { toast('Minimo 3 jogadores'); return; }
  if (!deckId) { toast('Escolha um baralho'); return; }
  if (impostors >= players.length) { toast('Impostores demais!'); return; }

  const deck = DECKS.find(d => d.id === deckId);
  if (deck.custom) {
    const w = prompt('Digite a palavra secreta:');
    if (!w) return;
    deck.words = [w.trim()];
  }

  const word = deck.words[Math.floor(Math.random() * deck.words.length)];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const impostorSet = new Set(shuffled.slice(0, impostors));

  state.impostorCount = impostors;
  state.assignments = players.map(name => ({
    name,
    role: impostorSet.has(name) ? 'impostor' : 'word',
    word: impostorSet.has(name) ? 'IMPOSTOR' : word,
    realWord: word,
    deck: deck.name
  }));
  state.currentReveal = 0;
  state.currentTurn = 0;

  showReveal();
}

/* =============================================
   REVEAL + SWIPE
============================================= */
function showReveal() {
  showScreen('reveal-screen');
  renderRevealCard();
}

function renderRevealCard() {
  const a = state.assignments[state.currentReveal];
  const isImpostor = a.role === 'impostor';

  document.getElementById('reveal-player-name').textContent = a.name;
  document.getElementById('swipe-hint').classList.remove('visible');
  document.getElementById('reveal-hint').textContent = 'Toque na carta para ver sua palavra';

  document.getElementById('progress-dots').innerHTML = state.assignments.map((_, i) =>
    '<div class="dot ' + (i < state.currentReveal ? 'done' : i === state.currentReveal ? 'active' : '') + '"></div>'
  ).join('');

  const stage = document.getElementById('card-stage');
  stage.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'swipe-card';

  const emoji = isImpostor ? '&#128520;' : '&#127183;';
  const roleLabel = isImpostor ? '&#9888;&#65039; Voce e o Impostor' : '&#128274; Palavra Secreta';
  const subtitle = isImpostor
    ? 'Descubra a senha pescando nas dicas dos outros!'
    : 'Baralho: ' + a.deck + ' &mdash; Nao revele a palavra!';

  card.innerHTML =
    '<div class="card-back-content">' +
      '<div class="card-back-logo">?</div>' +
      '<div class="card-tap-hint">Toque para revelar</div>' +
    '</div>' +
    '<div class="card-front-content">' +
      '<span class="card-corner tl">' + emoji + '</span>' +
      '<div class="card-role-label">' + roleLabel + '</div>' +
      '<div class="card-word-text">' + a.word + '</div>' +
      '<div class="card-subtitle-text">' + subtitle + '</div>' +
      '<span class="card-corner br">' + emoji + '</span>' +
    '</div>';

  stage.appendChild(card);
  wireSwipe(card, isImpostor);
}

function wireSwipe(card, isImpostor) {
  card.addEventListener('pointerdown', function(e) {
    drag.startX = e.clientX; drag.startY = e.clientY;
    drag.curX = 0; drag.active = true;
    drag.revealed = card.classList.contains('revealed');
    card.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, { passive: false });

  card.addEventListener('pointermove', function(e) {
    if (!drag.active || !drag.revealed) return;
    drag.curX = e.clientX - drag.startX;
    const dy = (e.clientY - drag.startY) * 0.25;
    const tilt = (drag.curX / 280) * MAX_TILT;
    card.style.transition = 'none';
    card.style.transform = 'translate(' + drag.curX + 'px,' + dy + 'px) rotate(' + tilt + 'deg)';
    e.preventDefault();
  }, { passive: false });

  card.addEventListener('pointerup', function(e) {
    if (!drag.active) return;
    drag.active = false;
    const movedTotal = Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY);

    if (!drag.revealed) {
      if (movedTotal < 10) {
        card.classList.add('revealed', isImpostor ? 'card-impostor-style' : 'card-word-style');
        document.getElementById('swipe-hint').classList.add('visible');
        document.getElementById('reveal-hint').textContent = 'Arraste a carta para continuar';
      }
      return;
    }

    if (Math.abs(drag.curX) >= SWIPE_THRESHOLD) {
      const dir = drag.curX > 0 ? 1 : -1;
      card.style.transition = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s ease';
      card.style.transform = 'translate(' + (dir * (window.innerWidth + 320)) + 'px,-20px) rotate(' + (dir * MAX_TILT) + 'deg)';
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
      setTimeout(advanceReveal, 380);
    } else {
      card.style.transition = 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)';
      card.style.transform = 'none';
    }
  });

  card.addEventListener('pointercancel', function() {
    drag.active = false;
    card.style.transition = 'transform 0.32s ease';
    card.style.transform = 'none';
  });
}

function advanceReveal() {
  if (state.currentReveal < state.assignments.length - 1) {
    state.currentReveal++;
    renderRevealCard();
  } else {
    showPasswordScreen();
  }
}

/* =============================================
   PASSWORD CARD SCREEN
============================================= */
function showPasswordScreen() {
  showScreen('password-screen');
}

function askReveal() {
  document.getElementById('popup-overlay').classList.add('show');
}

function closePopup() {
  document.getElementById('popup-overlay').classList.remove('show');
}

function doReveal() {
  closePopup();
  const word = state.assignments[0].realWord;
  const impostors = state.assignments.filter(a => a.role === 'impostor').map(a => a.name);
  document.getElementById('result-verdict').textContent = 'A SENHA ERA';
  document.getElementById('result-verdict').className = 'result-verdict win';
  document.getElementById('result-sub').textContent = 'Agora sabem quem blefou?';
  document.getElementById('result-word').textContent = word;
  document.getElementById('result-impostor').textContent = impostors.join(' & ');
  showScreen('result-screen');
}

// Close popup on overlay click
document.getElementById('popup-overlay').addEventListener('click', function(e) {
  if (e.target === this) closePopup();
});

/* =============================================
   GAME SCREEN
============================================= */
function showGameScreen() {
  showScreen('game-screen');
  state.currentTurn = 0;
  renderTurns();
}

function renderTurns() {
  const players = state.assignments;
  document.getElementById('game-round-label').textContent = 'Rodada de Pistas';
  document.getElementById('game-category-label').textContent =
    'Baralho: ' + players[0].deck + ' &middot; ' + players.length + ' jogadores &middot; ' +
    state.impostorCount + ' impostor' + (state.impostorCount > 1 ? 'es' : '');

  document.getElementById('turn-list').innerHTML = players.map((p, i) =>
    '<div class="turn-item ' + (i === state.currentTurn ? 'active' : i < state.currentTurn ? 'done' : '') + '">' +
    '<span class="turn-number">' + (i+1) + '</span>' +
    '<span class="turn-name">' + p.name + '</span>' +
    '<span class="turn-status">' + (i === state.currentTurn ? '&#127897; Sua vez' : i < state.currentTurn ? '&#10003; Falou' : '') + '</span>' +
    '</div>'
  ).join('');

  document.getElementById('btn-next-turn').textContent = state.currentTurn >= players.length - 1 ? 'Ultima rodada &#10003;' : 'Proximo &rarr;';
  document.getElementById('btn-prev-turn').style.display = state.currentTurn > 0 ? 'inline-block' : 'none';
}

function nextTurn() {
  if (state.currentTurn < state.assignments.length - 1) { state.currentTurn++; renderTurns(); }
}
function prevTurn() {
  if (state.currentTurn > 0) { state.currentTurn--; renderTurns(); }
}

/* =============================================
   UTILS
============================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function resetGame() { showScreen('home-screen'); }

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

init();
