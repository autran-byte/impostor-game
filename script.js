/* =============================================
   SUPABASE CONFIG
============================================= */
const supabaseClient = supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_PUBLISHABLE_KEY
);

/* =============================================
   FALLBACK LOCAL
   usado se o Supabase falhar
============================================= */
const LOCAL_DECKS = [
  {
    id: "animais",
    name: "Animais",
    icon: "🦁",
    words: [
      "Elefante",
      "Tubarao",
      "Papagaio",
      "Coruja",
      "Cobra",
      "Gorila",
      "Pinguim",
      "Camelo",
      "Hipopotamo",
      "Pantera"
    ]
  },
  {
    id: "comidas",
    name: "Comidas",
    icon: "🍕",
    words: [
      "Pizza",
      "Sushi",
      "Lasanha",
      "Hamburguer",
      "Tapioca",
      "Feijoada",
      "Risoto",
      "Ramen",
      "Brigadeiro",
      "Pastel"
    ]
  },
  {
    id: "esportes",
    name: "Esportes",
    icon: "⚽",
    words: [
      "Futebol",
      "Natacao",
      "Judo",
      "Volei",
      "Ciclismo",
      "Boxe",
      "Basquete",
      "Tenis",
      "Polo Aquatico",
      "Esgrima"
    ]
  },
  {
    id: "filmes",
    name: "Filmes e Series",
    icon: "🎬",
    words: [
      "Matrix",
      "Titanic",
      "Breaking Bad",
      "Avatar",
      "Inception",
      "Friends",
      "Stranger Things",
      "Interstellar",
      "Coco",
      "Parasita"
    ]
  },
  {
    id: "profissoes",
    name: "Profissoes",
    icon: "💼",
    words: [
      "Astronauta",
      "Cirurgiao",
      "Arqueologo",
      "Diplomata",
      "Sommelier",
      "Mergulhador",
      "Relojoeiro",
      "Ilusionista",
      "Cartografo",
      "Chocolatier"
    ]
  },
  {
    id: "lugares",
    name: "Lugares",
    icon: "🌍",
    words: [
      "Amazonia",
      "Dubai",
      "Antartida",
      "Veneza",
      "Toquio",
      "Machu Picchu",
      "Las Vegas",
      "Islandia",
      "Maldivas",
      "Petra"
    ]
  },
  {
    id: "objetos",
    name: "Objetos",
    icon: "🔑",
    words: [
      "Telescopio",
      "Bussola",
      "Metronomo",
      "Caleidoscopio",
      "Sextante",
      "Termometro",
      "Periscopio",
      "Abajur",
      "Relogio de Sol",
      "Pendulo"
    ]
  },
  {
    id: "custom",
    name: "Personalizado",
    icon: "✏️",
    words: [],
    custom: true
  }
];

let DECKS = [];
let dataSource = "unknown";

/* =============================================
   STATE
============================================= */
const state = {
  players: [],
  impostorCount: 1,
  selectedDeck: null,
  assignments: [],
  currentReveal: 0,
  currentTurn: 0
};

const SWIPE_THRESHOLD = 85;
const MAX_TILT = 20;

let drag = {
  active: false,
  startX: 0,
  startY: 0,
  curX: 0,
  revealed: false
};

/* =============================================
   INIT
============================================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupEventListeners();
  renderDeckLoading("Carregando baralhos...");

  try {
    validateSupabaseClient();
    await loadDecksFromSupabase();

    if (!Array.isArray(DECKS) || DECKS.length === 0) {
      throw new Error("Supabase retornou zero baralhos.");
    }

    dataSource = "supabase";
    console.info("Baralhos carregados do Supabase:", DECKS);
  } catch (error) {
    console.warn("Usando fallback local. Motivo:", error);

    DECKS = cloneDecks(LOCAL_DECKS);
    dataSource = "local";

    toast("Falha ao carregar Supabase. Usando baralhos locais.");
  }

  renderDecks();
}

function setupEventListeners() {
  const btnGoSetup = document.getElementById("btn-go-setup");
  const btnAddPlayer = document.getElementById("btn-add-player");
  const newPlayerInput = document.getElementById("new-player-name");
  const btnBackHome = document.getElementById("btn-back-home");
  const btnStartGame = document.getElementById("btn-start-game");
  const passwordCard = document.getElementById("password-card");
  const btnStartRound = document.getElementById("btn-start-round");
  const btnPrevTurn = document.getElementById("btn-prev-turn");
  const btnNextTurn = document.getElementById("btn-next-turn");
  const btnShowPassword = document.getElementById("btn-show-password");
  const btnResetGame = document.getElementById("btn-reset-game");
  const btnPlayAgain = document.getElementById("btn-play-again");
  const btnPopupNo = document.getElementById("btn-popup-no");
  const btnPopupYes = document.getElementById("btn-popup-yes");
  const popupOverlay = document.getElementById("popup-overlay");

  if (btnGoSetup) {
    btnGoSetup.addEventListener("click", () => showScreen("setup-screen"));
  }

  if (btnAddPlayer) {
    btnAddPlayer.addEventListener("click", addPlayer);
  }

  if (newPlayerInput) {
    newPlayerInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        addPlayer();
      }
    });
  }

  if (btnBackHome) {
    btnBackHome.addEventListener("click", () => showScreen("home-screen"));
  }

  if (btnStartGame) {
    btnStartGame.addEventListener("click", startGame);
  }

  if (passwordCard) {
    passwordCard.addEventListener("click", askReveal);
  }

  if (btnStartRound) {
    btnStartRound.addEventListener("click", showGameScreen);
  }

  if (btnPrevTurn) {
    btnPrevTurn.addEventListener("click", prevTurn);
  }

  if (btnNextTurn) {
    btnNextTurn.addEventListener("click", nextTurn);
  }

  if (btnShowPassword) {
    btnShowPassword.addEventListener("click", showPasswordScreen);
  }

  if (btnResetGame) {
    btnResetGame.addEventListener("click", resetGame);
  }

  if (btnPlayAgain) {
    btnPlayAgain.addEventListener("click", startGame);
  }

  if (btnPopupNo) {
    btnPopupNo.addEventListener("click", closePopup);
  }

  if (btnPopupYes) {
    btnPopupYes.addEventListener("click", doReveal);
  }

  if (popupOverlay) {
    popupOverlay.addEventListener("click", event => {
      if (event.target === popupOverlay) {
        closePopup();
      }
    });
  }
}

function validateSupabaseClient() {
  if (typeof supabase === "undefined") {
    throw new Error("Biblioteca do Supabase não foi carregada.");
  }

  if (!supabaseClient) {
    throw new Error("Cliente do Supabase não foi inicializado.");
  }
}

function cloneDecks(decks) {
  return decks.map(deck => ({
    ...deck,
    words: [...(deck.words || [])]
  }));
}

/* =============================================
   DECK LOADING
============================================= */
function renderDeckLoading(message = "Carregando...") {
  const grid = document.getElementById("deck-grid");

  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;color:var(--muted);text-align:center;padding:1rem;">
      ${message}
    </div>
  `;
}

async function loadDecksFromSupabase() {
  const decksResponse = await supabaseClient
    .from("decks")
    .select("id, name, icon, is_custom, sort_order")
    .order("sort_order", { ascending: true });

  console.log("Resposta decks:", decksResponse);

  if (decksResponse.error) {
    throw decksResponse.error;
  }

  const wordsResponse = await supabaseClient
    .from("words")
    .select("deck_id, word, sort_order")
    .order("sort_order", { ascending: true });

  console.log("Resposta words:", wordsResponse);

  if (wordsResponse.error) {
    throw wordsResponse.error;
  }

  const decks = decksResponse.data || [];
  const words = wordsResponse.data || [];

  if (decks.length === 0) {
    throw new Error("Supabase retornou zero baralhos na tabela decks.");
  }

  DECKS = decks.map(deck => {
    const deckWords = words
      .filter(wordItem => wordItem.deck_id === deck.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(wordItem => wordItem.word)
      .filter(Boolean);

    return {
      id: deck.id,
      name: deck.name,
      icon: deck.icon,
      custom: deck.is_custom,
      words: deckWords
    };
  });

  console.log("DECKS montado:", DECKS);
}

function renderDecks() {
  const grid = document.getElementById("deck-grid");

  if (!grid) return;

  grid.innerHTML = "";

  if (!Array.isArray(DECKS) || DECKS.length === 0) {
    renderDeckLoading("Nenhum baralho encontrado.");
    return;
  }

  DECKS.forEach(deck => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "deck-card";
    card.dataset.id = deck.id;

    card.addEventListener("click", () => selectDeck(deck.id));

    const icon = document.createElement("div");
    icon.className = "deck-icon";
    icon.textContent = deck.icon;

    const name = document.createElement("div");
    name.className = "deck-name";
    name.textContent = deck.name;

    const count = document.createElement("div");
    count.className = "deck-count";
    count.textContent = deck.custom
      ? "Sua escolha"
      : `${deck.words.length} palavras`;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(count);

    grid.appendChild(card);
  });

  console.info(`Fonte dos baralhos: ${dataSource}`);
}

function selectDeck(id) {
  const deck = DECKS.find(d => d.id === id);

  if (!deck) {
    toast("Baralho não encontrado.");
    return;
  }

  state.selectedDeck = id;

  document.querySelectorAll(".deck-card").forEach(card => {
    card.classList.remove("selected");
  });

  const selectedCard = document.querySelector(`.deck-card[data-id="${id}"]`);

  if (selectedCard) {
    selectedCard.classList.add("selected");
  }
}

/* =============================================
   PLAYERS
============================================= */
function addPlayer() {
  const inp = document.getElementById("new-player-name");
  const name = inp.value.trim();

  if (!name) return;

  if (state.players.includes(name)) {
    toast("Nome já existe");
    return;
  }

  state.players.push(name);
  inp.value = "";
  renderPlayers();
}

function removePlayer(idx) {
  state.players.splice(idx, 1);
  renderPlayers();
}

function renderPlayers() {
  const playerList = document.getElementById("player-list");

  if (!playerList) return;

  playerList.innerHTML = "";

  state.players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "player-item";

    const number = document.createElement("span");
    number.className = "num";
    number.textContent = index + 1;

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = player;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove";
    removeButton.innerHTML = "&times;";
    removeButton.addEventListener("click", () => removePlayer(index));

    item.appendChild(number);
    item.appendChild(name);
    item.appendChild(removeButton);

    playerList.appendChild(item);
  });
}

/* =============================================
   START GAME
============================================= */
function startGame() {
  const players = state.players;
  const impostors = parseInt(document.getElementById("impostor-count").value || 1);
  const deckId = state.selectedDeck;

  if (players.length < 3) {
    toast("Mínimo 3 jogadores");
    return;
  }

  if (!deckId) {
    toast("Escolha um baralho");
    return;
  }

  if (impostors >= players.length) {
    toast("Impostores demais!");
    return;
  }

  const deck = DECKS.find(d => d.id === deckId);

  if (!deck) {
    toast("Baralho não encontrado.");
    return;
  }

  if (deck.custom) {
    const word = prompt("Digite a palavra secreta:");

    if (!word) return;

    deck.words = [word.trim()];
  }

  if (!deck.words || deck.words.length === 0) {
    toast("Este baralho não tem palavras.");
    return;
  }

  const word = deck.words[Math.floor(Math.random() * deck.words.length)];
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const impostorSet = new Set(shuffled.slice(0, impostors));

  state.impostorCount = impostors;

  state.assignments = players.map(name => ({
    name,
    role: impostorSet.has(name) ? "impostor" : "word",
    word: impostorSet.has(name) ? "IMPOSTOR" : word,
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
  showScreen("reveal-screen");
  renderRevealCard();
}

function renderRevealCard() {
  const assignment = state.assignments[state.currentReveal];

  if (!assignment) {
    toast("Erro ao carregar carta.");
    showScreen("setup-screen");
    return;
  }

  const isImpostor = assignment.role === "impostor";

  document.getElementById("reveal-player-name").textContent = assignment.name;
  document.getElementById("swipe-hint").classList.remove("visible");
  document.getElementById("reveal-hint").textContent = "Toque na carta para ver sua palavra";

  document.getElementById("progress-dots").innerHTML = state.assignments
    .map((_, index) =>
      '<div class="dot ' +
        (index < state.currentReveal ? "done" : index === state.currentReveal ? "active" : "") +
      '"></div>'
    )
    .join("");

  const stage = document.getElementById("card-stage");
  stage.innerHTML = "";

  const card = document.createElement("div");
  card.className = "swipe-card";

  const emoji = isImpostor ? "😈" : "🃏";
  const roleLabel = isImpostor ? "⚠️ Você é o Impostor" : "🔒 Palavra Secreta";
  const subtitle = isImpostor
    ? "Descubra a senha pescando nas dicas dos outros!"
    : "Baralho: " + assignment.deck + " — Não revele a palavra!";

  card.innerHTML =
    '<div class="card-back-content">' +
      '<div class="card-back-logo">?</div>' +
      '<div class="card-tap-hint">Toque para revelar</div>' +
    "</div>" +
    '<div class="card-front-content">' +
      '<span class="card-corner tl">' + emoji + "</span>" +
      '<div class="card-role-label">' + roleLabel + "</div>" +
      '<div class="card-word-text">' + assignment.word + "</div>" +
      '<div class="card-subtitle-text">' + subtitle + "</div>" +
      '<span class="card-corner br">' + emoji + "</span>" +
    "</div>";

  stage.appendChild(card);
  wireSwipe(card, isImpostor);
}

function wireSwipe(card, isImpostor) {
  card.addEventListener("pointerdown", function(e) {
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.curX = 0;
    drag.active = true;
    drag.revealed = card.classList.contains("revealed");

    card.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, { passive: false });

  card.addEventListener("pointermove", function(e) {
    if (!drag.active || !drag.revealed) return;

    drag.curX = e.clientX - drag.startX;

    const dy = (e.clientY - drag.startY) * 0.25;
    const tilt = (drag.curX / 280) * MAX_TILT;

    card.style.transition = "none";
    card.style.transform = "translate(" + drag.curX + "px," + dy + "px) rotate(" + tilt + "deg)";

    e.preventDefault();
  }, { passive: false });

  card.addEventListener("pointerup", function(e) {
    if (!drag.active) return;

    drag.active = false;

    const movedTotal =
      Math.abs(e.clientX - drag.startX) +
      Math.abs(e.clientY - drag.startY);

    if (!drag.revealed) {
      if (movedTotal < 10) {
        card.classList.add(
          "revealed",
          isImpostor ? "card-impostor-style" : "card-word-style"
        );

        document.getElementById("swipe-hint").classList.add("visible");
        document.getElementById("reveal-hint").textContent = "Arraste a carta para continuar";
      }

      return;
    }

    if (Math.abs(drag.curX) >= SWIPE_THRESHOLD) {
      const dir = drag.curX > 0 ? 1 : -1;

      card.style.transition =
        "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s ease";

      card.style.transform =
        "translate(" +
        (dir * (window.innerWidth + 320)) +
        "px,-20px) rotate(" +
        (dir * MAX_TILT) +
        "deg)";

      card.style.opacity = "0";
      card.style.pointerEvents = "none";

      setTimeout(advanceReveal, 380);
    } else {
      card.style.transition = "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)";
      card.style.transform = "none";
    }
  });

  card.addEventListener("pointercancel", function() {
    drag.active = false;
    card.style.transition = "transform 0.32s ease";
    card.style.transform = "none";
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
  showScreen("password-screen");
}

function askReveal() {
  document.getElementById("popup-overlay").classList.add("show");
}

function closePopup() {
  document.getElementById("popup-overlay").classList.remove("show");
}

function doReveal() {
  closePopup();

  const word = state.assignments[0].realWord;
  const impostors = state.assignments
    .filter(assignment => assignment.role === "impostor")
    .map(assignment => assignment.name);

  document.getElementById("result-verdict").textContent = "A SENHA ERA";
  document.getElementById("result-verdict").className = "result-verdict win";
  document.getElementById("result-sub").textContent = "Agora sabem quem blefou?";
  document.getElementById("result-word").textContent = word;
  document.getElementById("result-impostor").textContent = impostors.join(" & ");

  showScreen("result-screen");
}


/* =============================================
   GAME SCREEN
============================================= */
function showGameScreen() {
  showScreen("game-screen");
  state.currentTurn = 0;
  renderTurns();
}

function renderTurns() {
  const players = state.assignments;

  document.getElementById("game-round-label").textContent = "Rodada de Pistas";
  document.getElementById("game-category-label").innerHTML =
    "Baralho: " +
    players[0].deck +
    " &middot; " +
    players.length +
    " jogadores &middot; " +
    state.impostorCount +
    " impostor" +
    (state.impostorCount > 1 ? "es" : "");

  document.getElementById("turn-list").innerHTML = players
    .map((player, index) =>
      '<div class="turn-item ' +
        (index === state.currentTurn ? "active" : index < state.currentTurn ? "done" : "") +
      '">' +
        '<span class="turn-number">' + (index + 1) + "</span>" +
        '<span class="turn-name">' + player.name + "</span>" +
        '<span class="turn-status">' +
          (index === state.currentTurn ? "🎙️ Sua vez" : index < state.currentTurn ? "✓ Falou" : "") +
        "</span>" +
      "</div>"
    )
    .join("");

  document.getElementById("btn-next-turn").textContent =
    state.currentTurn >= players.length - 1
      ? "Última rodada ✓"
      : "Próximo →";

  document.getElementById("btn-prev-turn").style.display =
    state.currentTurn > 0 ? "inline-block" : "none";
}

function nextTurn() {
  if (state.currentTurn < state.assignments.length - 1) {
    state.currentTurn++;
    renderTurns();
  }
}

function prevTurn() {
  if (state.currentTurn > 0) {
    state.currentTurn--;
    renderTurns();
  }
}

/* =============================================
   UTILS
============================================= */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const targetScreen = document.getElementById(id);

  if (targetScreen) {
    targetScreen.classList.add("active");
  }
}

function resetGame() {
  state.assignments = [];
  state.currentReveal = 0;
  state.currentTurn = 0;
  showScreen("home-screen");
}

let toastTimer;

function toast(msg) {
  const el = document.getElementById("toast");

  if (!el) return;

  el.textContent = msg;
  el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}