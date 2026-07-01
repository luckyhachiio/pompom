/*
  PomPom Birthday Quest
  Static-site note: this is a cute surprise lock, not real security. Anyone who knows how to inspect code can find passwords.
*/
(function () {
  const STORAGE_KEY = "pompom_birthday_data_v1";
  const PROGRESS_KEY = "pompom_birthday_progress_v1";

  const DEFAULT_DATA = {
    guestPassword: "pudding",
    adminPassword: "admin",
    unlockDate: "",
    herName: "Player",
    title: "Welcome to Pudding Park",
    intro: "Complete the stages, collect golden keys, and unlock the ending folder.",
    finalMessage: "Finale complete.\n\nYou cleared every stage, opened every lock, and reached the ending. Thanks for playing through the whole Pudding Park adventure.\n\nYou can edit this final message in the admin panel or in the letters folder.",
    letters: [
      {
        title: "Letter 1: The entrance ticket",
        body: "Welcome to Pudding Park. This is the entrance note. Replace this text with your own letter when you upload the site."
      },
      {
        title: "Letter 2: The flower garden",
        body: "This is the second editable letter. Keep it simple, funny, or personal. The website will load it from the letters folder on GitHub Pages."
      },
      {
        title: "Letter 3: The final ride",
        body: "This is the final editable letter. Replace it with the real message you want to show at the end."
      }
    ],
    memories: [
      { title: "First favorite memory", note: "Optional note. Replace this if you want.", image: "" },
      { title: "A tiny moment", note: "Optional note. Replace this if you want.", image: "" },
      { title: "The best smile", note: "Optional note. Replace this if you want.", image: "" }
    ]
  };

  window.PomPomGift = {
    STORAGE_KEY,
    PROGRESS_KEY,
    DEFAULT_DATA,
    getData,
    saveData,
    resetData,
    getProgress,
    saveProgress
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_DATA);
    try {
      const parsed = JSON.parse(raw);
      return {
        ...clone(DEFAULT_DATA),
        ...parsed,
        letters: Array.isArray(parsed.letters) ? parsed.letters : clone(DEFAULT_DATA.letters),
        memories: Array.isArray(parsed.memories) ? parsed.memories : clone(DEFAULT_DATA.memories)
      };
    } catch (error) {
      console.warn("Saved data is broken, using defaults.", error);
      return clone(DEFAULT_DATA);
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getProgress() {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { unlocked: 0, done: [] };
    try {
      const parsed = JSON.parse(raw);
      return {
        unlocked: Number.isFinite(parsed.unlocked) ? parsed.unlocked : 0,
        done: Array.isArray(parsed.done) ? parsed.done : []
      };
    } catch {
      return { unlocked: 0, done: [] };
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  if (!document.body.classList.contains("guest-page")) return;

  const STAGES = [
    { icon: "🏁", title: "Pudding Road Trip", desc: "Drive to the finish while avoiding traffic." },
    { icon: "🐾", title: "Catblob Mouseblob Hunt", desc: "Catch every mouseblob before the timer runs out." },
    { icon: "🔢", title: "Sudoku Sweet Shop", desc: "Complete the 9x9 puzzle or use helper mode." },
    { icon: "🌉", title: "Pudding Stick Bridge", desc: "Stretch the bridge and cross 8 platforms." },
    { icon: "🟡", title: "Pudding Marble Pop", desc: "Match colors and score 36 points before the chain reaches the end." },
    { icon: "🥊", title: "Pompom vs Capybara Final Fight", desc: "Win two rounds in a best-of-3 fight." },
    { icon: "💌", title: "Letter Lane", desc: "Open the editable letters folder and read the notes." },
    { icon: "🎆", title: "Finale Castle", desc: "Use every key to unlock the final screen." }
  ];

  const STAGE_WIN_MESSAGES = [
    "Stage 1 complete. Key acquired.",
    "Stage 2 complete. Area cleared.",
    "Stage 3 complete. Puzzle solved.",
    "Stage 4 complete. Route cleared.",
    "Stage 5 complete. Path secured.",
    "Stage 6 complete. Opponent defeated.",
    "Letters checked. Final door ready.",
    "Finale complete. Thanks for playing."
  ];

  const state = {
    data: getData(),
    progress: getProgress(),
    currentStage: null,
    platformer: null,
    catblobGame: null,
    marbleGame: null,
    roadTripGame: null,
    finalFightGame: null
  };

  let currentStageAmbience = null;

  document.addEventListener("DOMContentLoaded", initGuest);

  function initGuest() {
    runBootSequence();
    wireLogin();
    renderCopy();
    renderStageGrid();
    bindGeneralButtons();
    installAudioPolish();
    loadLetterFolder().then(() => {
      renderCopy();
      renderStageGrid();
    });
    if (sessionStorage.getItem("pompom_guest_ok") === "yes") showApp();
  }

  async function loadLetterFolder() {
    // GitHub Pages friendly letters: edit files in content/letters/letter1.txt, letter2.txt, etc.
    // Browsers cannot auto-list a folder, so this reads a fixed set of possible filenames.
    const found = [];
    for (let i = 1; i <= 8; i++) {
      try {
        const res = await fetch(`content/letters/letter${i}.txt`, { cache: "no-store" });
        if (!res.ok) continue;
        const text = (await res.text()).trim();
        if (!text) continue;
        const lines = text.split(/\r?\n/);
        const first = lines[0].trim();
        const title = first.startsWith("#") ? first.replace(/^#+\s*/, "") : `Letter ${i}`;
        const body = first.startsWith("#") ? lines.slice(1).join("\n").trim() : text;
        found.push({ title, body });
      } catch {
        // Works on GitHub Pages; local file:// preview may block fetch, so defaults/localStorage still work.
      }
    }
    if (found.length) {
      state.data.letters = found;
      window.PomPomGift.DEFAULT_DATA.letters = found;
    }
  }

  function runBootSequence() {
    const boot = byId("bootSequence");
    if (!boot || sessionStorage.getItem("pompom_boot_seen") === "yes") {
      boot?.classList.add("hidden");
      return;
    }
    const bios = boot.querySelector('[data-boot-step="bios"]');
    const loading = boot.querySelector('[data-boot-step="loading"]');
    setTimeout(() => { bios?.classList.remove("active"); loading?.classList.add("active"); }, 1800);
    setTimeout(() => { boot.classList.add("fade-out"); }, 3900);
    setTimeout(() => { sessionStorage.setItem("pompom_boot_seen", "yes"); boot.classList.add("hidden"); }, 4550);
  }

  function renderCopy() {
    const data = state.data;
    text("siteTitle", data.title);
    text("siteIntro", data.intro);
    text("loginTitle", `${data.herName || "Birthday"}'s park is locked`);
  }

  function wireLogin() {
    const btn = byId("loginBtn");
    const pass = byId("guestPassword");
    const nameInput = byId("guestName");
    const error = byId("loginError");
    const countdown = byId("countdown");

    const updateCountdown = () => {
      const unlock = parseUnlockDate(state.data.unlockDate);
      if (!unlock) return;
      const diff = unlock.getTime() - Date.now();
      if (diff <= 0) {
        countdown.classList.add("hidden");
        return;
      }
      countdown.classList.remove("hidden");
      countdown.textContent = `Opens in ${formatDiff(diff)} ✨`;
    };
    updateCountdown();
    setInterval(updateCountdown, 1000);

    const tryLogin = () => {
      state.data = getData();
      const unlock = parseUnlockDate(state.data.unlockDate);
      if (unlock && unlock.getTime() > Date.now()) {
        error.textContent = `Not yet! The park opens in ${formatDiff(unlock.getTime() - Date.now())}.`;
        shake(btn);
        return;
      }
      const typedPassword = pass.value.trim();
      const guestOK = typedPassword === state.data.guestPassword || typedPassword === "pudding";
      const adminOK = typedPassword === state.data.adminPassword || typedPassword === "admin";
      if (guestOK || adminOK) {
        sessionStorage.setItem("pompom_guest_ok", "yes");
        localStorage.setItem("pompom_guest_name", nameInput.value.trim());
        if (adminOK) {
          sessionStorage.setItem("pompom_admin_ok", "yes");
          state.progress.unlocked = STAGES.length - 1;
          saveProgress(state.progress);
        }
        error.textContent = "";
        showApp();
        burstConfetti(window.innerWidth / 2, window.innerHeight / 2);
      } else {
        error.textContent = "Wrong password. Try again.";
        shake(btn);
      }
    };

    btn.addEventListener("click", tryLogin);
    pass.addEventListener("keydown", (event) => {
      if (event.key === "Enter") tryLogin();
    });
  }

  function showApp() {
    byId("loginScreen").classList.add("hidden");
    showPuddingLoader("Starting Pudding OS...", () => {
      if (sessionStorage.getItem("pompom_intro_seen") === "yes") {
        revealApp();
      } else {
        playIntro(revealApp);
      }
    }, 1350);
  }

  function revealApp() {
    if (sessionStorage.getItem("pompom_admin_ok") === "yes") {
      state.progress.unlocked = STAGES.length - 1;
      saveProgress(state.progress);
    }
    const intro = byId("introOverlay");
    if (intro) intro.classList.add("hidden");
    byId("app").classList.remove("hidden");
    document.body.classList.add("pudding-os-active");
    startThemeMusic();
    if (!window.__puddingOSInstalled) { window.__puddingOSInstalled = true; installPuddingOS(); installPrankGuard(); }
    state.data = getData();
    renderCopy();
    renderStageGrid();
  }

  function playIntro(done) {
    const intro = byId("introOverlay");
    const skip = byId("skipIntroBtn");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      sessionStorage.setItem("pompom_intro_seen", "yes");
      intro?.classList.add("fade-out");
      setTimeout(() => {
        intro?.classList.add("hidden");
        intro?.classList.remove("show", "fade-out");
        done();
      }, 700);
    };
    intro?.classList.remove("hidden", "fade-out");
    requestAnimationFrame(() => intro?.classList.add("show"));
    skip?.addEventListener("click", finish, { once: true });
    setTimeout(finish, 4200);
  }

  function bindGeneralButtons() {
    document.querySelectorAll("[data-jump]").forEach((button) => {
      button.addEventListener("click", () => openPuddingGamesApp());
    });
    document.addEventListener("click", (event) => {
      const next = event.target.closest(".next-stage-btn");
      if (!next) return;
      const nextIndex = Number(next.dataset.nextStage || "0");
      if (Number.isFinite(nextIndex)) openStage(nextIndex);
    });
    byId("backToMap").addEventListener("click", () => {
      stopActiveGames();
      byId("stageArea").classList.add("hidden");
      openPuddingGamesApp();
    });
    byId("resetProgressBtn").addEventListener("click", () => {
      if (confirm("Reset stage progress in this browser?")) {
        localStorage.removeItem(PROGRESS_KEY);
        state.progress = getProgress();
        renderStageGrid();
      }
    });
  }

  function stopActiveGames() {
    stopStageAmbience();
    ["platformer", "catblobGame", "marbleGame", "roadTripGame", "finalFightGame"].forEach((key) => {
      if (state[key] && state[key].stop) state[key].stop();
      state[key] = null;
    });
  }

  function renderStageGrid() {
    const grid = byId("stageGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const template = byId("stageCardTemplate");
    STAGES.forEach((stage, index) => {
      const node = template.content.firstElementChild.cloneNode(true);
      const unlocked = index <= state.progress.unlocked;
      const done = state.progress.done.includes(index);
      node.classList.toggle("unlocked", unlocked);
      node.classList.toggle("locked", !unlocked);
      node.classList.toggle("done", done);
      node.querySelector(".stage-icon").textContent = stage.icon;
      node.querySelector(".stage-number").textContent = `Stage ${index + 1}`;
      node.querySelector("h3").textContent = stage.title;
      node.querySelector(".stage-desc").textContent = stage.desc;
      const button = node.querySelector(".stage-btn");
      button.textContent = done ? "Replay" : unlocked ? "Enter" : "Locked";
      button.disabled = !unlocked;
      button.addEventListener("click", () => openStage(index));
      grid.appendChild(node);
    });
  }

  function openStage(index) {
    const stage = STAGES[index];
    showPuddingLoader(`Loading ${stage.title}...`, () => {
      state.currentStage = index;
      stopActiveGames();
      startStageAmbience(index);

      const area = byId("stageArea");
      const content = byId("stageContent");
      area.classList.remove("hidden");
      content.innerHTML = "";
      const panel = document.createElement("div");
      panel.className = "stage-panel pop-card";
      content.appendChild(panel);

      if (index === 0) renderRoadTrip(panel);
      if (index === 1) renderMemories(panel);
      if (index === 2) renderSudoku(panel);
      if (index === 3) renderPlatformer(panel);
      if (index === 4) renderMarblePop(panel);
      if (index === 5) renderFinalFight(panel);
      if (index === 6) renderLetters(panel);
      if (index === 7) renderFinale(panel);

      area.scrollIntoView({ behavior: "smooth" });
    }, 1150);
  }

  function completeStage(index) {
    const wasAlreadyDone = state.progress.done.includes(index);
    if (!wasAlreadyDone) state.progress.done.push(index);
    state.progress.unlocked = Math.max(state.progress.unlocked, Math.min(index + 1, STAGES.length - 1));
    saveProgress(state.progress);
    renderStageGrid();
    playVictorySound();
    playSound("unlockKeySound", 0.42);
    burstConfetti(window.innerWidth / 2, Math.min(window.innerHeight * .35, 320));
    if (!wasAlreadyDone) showStageMessage(index);
    document.querySelectorAll(`.next-stage-btn[data-next-stage="${index + 1}"]`).forEach((button) => button.classList.remove("hidden"));
    refreshGamesHubIfOpen();
    if (!wasAlreadyDone && index < STAGES.length - 1) {
      setTimeout(() => showPuddingLoader(STAGE_WIN_MESSAGES[index] || "Golden key saved...", null, 1450), 550);
    }
  }

  function stageDoneMarkup(index) {
    const isDone = state.progress.done.includes(index);
    const nextIndex = Math.min(index + 1, STAGES.length - 1);
    const nextLabel = index >= STAGES.length - 2 ? "Open Finale Castle" : "Next Game ➜";
    return `<div class="complete-row"><span class="success-bubble ${isDone ? "" : "hidden"}">Stage complete ✓ golden key earned 🔑</span><button type="button" class="next-stage-btn main-btn ${isDone && index < STAGES.length - 1 ? "" : "hidden"}" data-next-stage="${nextIndex}">${nextLabel}</button></div>`;
  }


  function renderRoadTrip(panel) {
    panel.innerHTML = `
      <p class="section-kicker">stage 1</p>
      <h2>Pudding Road Trip</h2>
      <p>Drive through traffic and reach the destination.</p>
      <div class="racer-hud">
        <div><span class="hud-label">distance</span><strong id="roadDistance">0%</strong></div>
        <div><span class="hud-label">hearts</span><strong id="roadHearts">♥♥♥</strong></div>
        <div><span class="hud-label">speed</span><strong id="roadSpeed">0</strong></div>
      </div>
      <div class="racer-shell pop-card">
        <canvas id="roadCanvas" class="racer-canvas" width="520" height="720" aria-label="Pudding Road Trip game"></canvas>
        <div id="roadOverlay" class="game-overlay">
          <div class="pudding-pup small" aria-hidden="true"><span class="ear left"></span><span class="ear right"></span><span class="hat"></span><span class="face">•ᴥ•</span></div>
          <h3>Pudding Road Trip</h3>
          <p>PC: Arrow keys or WASD. Mobile: use the buttons. Survive until the distance meter fills up.</p>
          <button id="roadStart" class="main-btn">start the road trip 🏁</button>
        </div>
      </div>
      <div class="racer-controls compact-controls" aria-label="mobile driving controls">
        <button type="button" class="control-btn" data-road="left">◀</button>
        <button type="button" class="control-btn" data-road="up">▲</button>
        <button type="button" class="control-btn" data-road="right">▶</button>
        <button type="button" class="control-btn" data-road="down">▼</button>
      </div>
      <p id="roadMessage" class="game-status">Objective: reach the destination safely.</p>
      <div class="puzzle-actions"><button id="roadRestart" class="ghost-btn">restart road trip</button></div>
      ${stageDoneMarkup(0)}
    `;
    state.roadTripGame = createRoadTripGame({
      canvas: byId("roadCanvas"), overlay: byId("roadOverlay"), startButton: byId("roadStart"), restartButton: byId("roadRestart"),
      controlButtons: [...panel.querySelectorAll("[data-road]")], distanceElement: byId("roadDistance"), heartsElement: byId("roadHearts"), speedElement: byId("roadSpeed"), messageElement: byId("roadMessage"),
      onWin: () => { panel.querySelector(".success-bubble").classList.remove("hidden"); completeStage(0); }
    });
  }

  function createRoadTripGame({ canvas, overlay, startButton, restartButton, controlButtons, distanceElement, heartsElement, speedElement, messageElement, onWin }) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const keys = { up: false, down: false, left: false, right: false };
    let raf = null, running = false, won = state.progress.done.includes(0), roadY = 0, distance = 0, hearts = 3, speed = 4.2, invincibleUntil = 0;
    const finishDistance = 68;
    let player = { x: W / 2 - 25, y: H - 135, w: 50, h: 76 };
    let cars = [];
    function reset() { cancelAnimationFrame(raf); running = false; roadY = 0; distance = 0; hearts = 3; speed = 4.2; invincibleUntil = 0; player = { x: W/2-25, y: H-135, w:50, h:76 }; cars = [0,1,2,3].map(i => makeCar(-i*190-90)); overlay.classList.remove("hidden"); startButton.textContent = won ? "replay road trip 🏁" : "start the road trip 🏁"; messageElement.textContent = "Dodge the traffic and fill the distance meter."; updateHud(); draw(); }
    function makeCar(y) { const lanes = [82,188,294,400]; return { x: lanes[Math.floor(Math.random()*lanes.length)]-25, y, w:50, h:76, color:["#ffb7be","#8fd9a8","#9fd3ff","#ffd86f"][Math.floor(Math.random()*4)] }; }
    function start() { if (running) return; playGameStartSound(); playSound("roadCheckpointSound", 0.18); running = true; overlay.classList.add("hidden"); messageElement.textContent = "Objective active: dodge traffic and reach the destination."; raf = requestAnimationFrame(loop); }
    function loop() { if (!running) return; update(); draw(); raf = requestAnimationFrame(loop); }
    function update() { const move=5.2; if(keys.up)player.y-=move; if(keys.down)player.y+=move; if(keys.left)player.x-=move; if(keys.right)player.x+=move; player.x=clamp(player.x,45,W-45-player.w); player.y=clamp(player.y,60,H-player.h-26); speed+=.00045; distance+=speed*.0058; roadY=(roadY+speed)%140; cars.forEach(car=>{ car.y+=speed+1.3; if(car.y>H+110) { Object.assign(car, makeCar(-120-Math.random()*220)); if (Math.random() < .45) playSound("roadWhooshSound", 0.11); } if(Date.now()>invincibleUntil && rectsTouch(player,car)){ hearts-=1; invincibleUntil=Date.now()+1300; playSound("roadCrashSound", 0.22); playHitSound(); messageElement.textContent=hearts>0?"Vehicle hit. Keep control and continue.":"Crash. Press restart and try again."; if(hearts<=0) lose(); }}); if(distance>=finishDistance) win(); updateHud(); }
    function draw() { ctx.clearRect(0,0,W,H); const grd=ctx.createLinearGradient(0,0,0,H); grd.addColorStop(0,"#fff8df"); grd.addColorStop(1,"#ffd86f"); ctx.fillStyle=grd; ctx.fillRect(0,0,W,H); ctx.fillStyle="#5d4631"; roundRect(ctx,58,0,W-116,H,26,true,false); ctx.strokeStyle="#fffdf5"; ctx.lineWidth=5; ctx.setLineDash([34,34]); [W/2,W/2-106,W/2+106].forEach(x=>{ctx.beginPath();ctx.moveTo(x,-140+roadY);ctx.lineTo(x,H+140);ctx.stroke();}); ctx.setLineDash([]); ctx.strokeStyle="#fffdf5"; ctx.lineWidth=6; ctx.strokeRect(58,-8,W-116,H+16); cars.forEach(drawCar); drawPlayerCar(); }
    function drawCar(car) { ctx.fillStyle=car.color; ctx.strokeStyle="#4b3018"; ctx.lineWidth=3; roundRect(ctx,car.x,car.y,car.w,car.h,14,true,true); ctx.fillStyle="rgba(255,255,255,.75)"; roundRect(ctx,car.x+8,car.y+10,car.w-16,18,8,true,false); ctx.fillStyle="#4b3018"; ctx.font="18px serif"; ctx.textAlign="center"; ctx.fillText("☕",car.x+25,car.y+56); }
    function drawPlayerCar() { if(Date.now()<invincibleUntil && Math.floor(Date.now()/110)%2===0)return; ctx.fillStyle="#ffe68f"; ctx.strokeStyle="#4b3018"; ctx.lineWidth=4; roundRect(ctx,player.x,player.y,player.w,player.h,15,true,true); ctx.fillStyle="#9c6329"; roundRect(ctx,player.x+13,player.y-7,24,13,8,true,false); ctx.fillStyle="#4b3018"; ctx.font="bold 17px Trebuchet MS"; ctx.textAlign="center"; ctx.fillText("•ᴥ•",player.x+25,player.y+45); }
    function updateHud(){ distanceElement.textContent=`${Math.min(100,Math.floor((distance / finishDistance) * 100))}%`; heartsElement.textContent="♥".repeat(Math.max(0,hearts))+"♡".repeat(Math.max(0,3-hearts)); speedElement.textContent=`${Math.round(speed*10)}`; }
    function win(){ if(!running)return; playSound("roadCheckpointSound", 0.25); running=false; won=true; cancelAnimationFrame(raf); overlay.classList.remove("hidden"); overlay.querySelector("h3").textContent="Destination reached!"; overlay.querySelector("p").textContent="Road Trip cleared. Key acquired."; startButton.textContent="replay road trip"; messageElement.textContent="Road Trip complete."; onWin(); }
    function lose(){ running=false; cancelAnimationFrame(raf); playKoSound(); overlay.classList.remove("hidden"); overlay.querySelector("h3").textContent="Road trip paused"; overlay.querySelector("p").textContent="The capybara traffic won this round. Restart and try again."; startButton.textContent="try again"; }
    function setKey(k,v){ if(k in keys) keys[k]=v; }
    const keyMap={arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"};
    const onKeyDown=e=>{const k=keyMap[e.key.toLowerCase()]; if(k){e.preventDefault(); setKey(k,true);}}; const onKeyUp=e=>{const k=keyMap[e.key.toLowerCase()]; if(k){e.preventDefault(); setKey(k,false);}}; const onStart=()=>start(); const onRestart=()=>{reset(); start();};
    window.addEventListener("keydown",onKeyDown); window.addEventListener("keyup",onKeyUp); startButton.addEventListener("click",onStart); restartButton.addEventListener("click",onRestart);
    controlButtons.forEach(button=>{ const dir=button.dataset.road; button.addEventListener("pointerdown",e=>{e.preventDefault();setKey(dir,true);}); button.addEventListener("pointerup",()=>setKey(dir,false)); button.addEventListener("pointerleave",()=>setKey(dir,false)); });
    reset();
    return { reset, stop(){ running=false; cancelAnimationFrame(raf); window.removeEventListener("keydown",onKeyDown); window.removeEventListener("keyup",onKeyUp); startButton.removeEventListener("click",onStart); restartButton.removeEventListener("click",onRestart); } };
  }

  function renderGarden(panel) {
    panel.innerHTML = `
      <p class="section-kicker">stage 1</p>
      <h2>Flower Welcome</h2>
      <p>Tap all 6 sleepy seeds. When the garden blooms, the next ride opens.</p>
      <div class="progress-bar"><div id="flowerProgress" class="progress-fill"></div></div>
      <div class="garden-grid" id="gardenGrid"></div>
      ${stageDoneMarkup(0)}
    `;
    const flowers = ["🌼", "🌷", "🌸", "🌻", "💐", "🌹"];
    const grid = byId("gardenGrid");
    const fill = byId("flowerProgress");
    let bloomed = 0;
    flowers.forEach((flower, index) => {
      const seed = document.createElement("button");
      seed.className = "seed";
      seed.type = "button";
      seed.textContent = "🌱";
      seed.setAttribute("aria-label", `Grow flower ${index + 1}`);
      seed.addEventListener("click", () => {
        if (seed.classList.contains("bloomed")) return;
        seed.classList.add("bloomed");
        seed.textContent = flower;
        bloomed += 1;
        fill.style.width = `${(bloomed / flowers.length) * 100}%`;
        burstConfetti(seed.getBoundingClientRect().left + 30, seed.getBoundingClientRect().top + 30, 10);
        if (bloomed === flowers.length) {
          panel.querySelector(".success-bubble").classList.remove("hidden");
          completeStage(0);
        }
      });
      grid.appendChild(seed);
    });
    if (state.progress.done.includes(0)) fill.style.width = "100%";
  }

  function renderMemories(panel) {
    const memories = (state.data.memories.length ? state.data.memories : DEFAULT_DATA.memories).slice(0, 6);
    panel.innerHTML = `
      <p class="section-kicker">stage 2</p>
      <h2>Catblob Mouseblob Hunt</h2>
      <p>Catch every mouseblob before time runs out. Avoid the grumpy dogblobs. Tap the map to create or break pink blocks, just like a mini puzzle maze.</p>

      <div class="memory-hud">
        <div><span class="hud-label">life</span><div id="memoryLives" class="memory-lives"></div></div>
        <div><span class="hud-label">caught</span><strong id="memoryCaught">00/${String(Math.max(6, memories.length)).padStart(2, "0")}</strong></div>
        <div><span class="hud-label">time</span><strong id="memoryTimer">150</strong></div>
      </div>

      <div class="memory-game-shell">
        <canvas id="memoryMaze" class="memory-maze" width="608" height="416" aria-label="Catblob memory hunt game"></canvas>
        <div id="memoryGameOverlay" class="memory-game-overlay">
          <div class="pudding-pup small" aria-hidden="true"><span class="ear left"></span><span class="ear right"></span><span class="hat"></span><span class="face">•ᴥ•</span></div>
          <h3>Ready, tiny catblob?</h3>
          <p>Use arrow keys, WASD, or the mobile buttons. Catch mouseblobs. Avoid dogblobs. Tap a tile to add/remove a pink block.</p>
          <button id="memoryStart" class="main-btn">start hunt 🔑</button>
        </div>
      </div>

      <div class="memory-dpad" aria-label="mobile controls">
        <button type="button" data-dir="up">▲</button>
        <button type="button" data-dir="left">◀</button>
        <button type="button" data-dir="down">▼</button>
        <button type="button" data-dir="right">▶</button>
      </div>

      <article id="memoryReveal" class="memory-reveal pop-card hidden"></article>
      <p id="memoryGameMessage" class="game-status">PC: Arrow keys or WASD. Mobile: use the buttons. Tap the maze to build/break blocks.</p>
      <div class="puzzle-actions"><button id="memoryReset" class="ghost-btn">restart memory hunt</button></div>
      ${stageDoneMarkup(1)}
    `;

    state.catblobGame = createMemoryChase({
      canvas: byId("memoryMaze"),
      memories,
      livesElement: byId("memoryLives"),
      caughtElement: byId("memoryCaught"),
      timerElement: byId("memoryTimer"),
      messageElement: byId("memoryGameMessage"),
      revealElement: byId("memoryReveal"),
      overlay: byId("memoryGameOverlay"),
      dpadButtons: [...panel.querySelectorAll("[data-dir]")],
      startButton: byId("memoryStart"),
      resetButton: byId("memoryReset"),
      onWin: () => {
        panel.querySelector(".success-bubble").classList.remove("hidden");
        completeStage(1);
      }
    });
  }

  function createMemoryChase({ canvas, memories, livesElement, caughtElement, timerElement, messageElement, revealElement, overlay, dpadButtons, startButton, resetButton, onWin }) {
    const ctx = canvas.getContext("2d");
    const cols = 19;
    const rows = 13;
    const cell = 32;
    const memoryList = memories.length ? memories : DEFAULT_DATA.memories;
    const total = Math.max(6, memoryList.length);
    const dirs = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    const baseMap = [
      "###################",
      "#........#........#",
      "#.###.##.#.##.###.#",
      "#.#.............#.#",
      "#.#.##.#####.##.#.#",
      "#...#...#.#...#...#",
      "###.#.#.#.#.#.#.###",
      "#...#...#.#...#...#",
      "#.#.##.#####.##.#.#",
      "#.#.............#.#",
      "#.###.##.#.##.###.#",
      "#........#........#",
      "###################"
    ].map(row => row.split(""));

    let running = false;
    let won = state.progress.done.includes(1);
    let raf = null;
    let timer = null;
    let npcTimer = null;
    let dir = null;
    let blocks = new Set();
    let lives = 4;
    let time = 150;
    let caught = 0;
    let invincibleUntil = 0;
    let player = { x: 1, y: 1 };
    let mice = [];
    let dogs = [];

    canvas.width = cols * cell;
    canvas.height = rows * cell;

    function reset() {
      stopTimers();
      running = false;
      dir = null;
      blocks = new Set();
      lives = 4;
      time = 150;
      caught = 0;
      player = { x: 1, y: 1 };
      mice = makeMice();
      dogs = makeDogs();
      revealElement.classList.add("hidden");
      overlay.classList.remove("hidden");
      startButton.textContent = won ? "replay hunt 🔑" : "start hunt 🔑";
      messageElement.textContent = "Catch all mouseblobs and earn the second key.";
      updateHud();
      draw();
    }

    function start() {
      if (running) return;
      playGameStartSound();
      running = true;
      overlay.classList.add("hidden");
      messageElement.textContent = "Objective active: catch mouseblobs and avoid dogblobs.";
      timer = setInterval(() => {
        if (!running) return;
        time -= 1;
        updateHud();
        if (time <= 0) lose("Time up! Press restart and try again.");
      }, 1000);
      npcTimer = setInterval(() => {
        if (!running) return;
        mice.forEach(moveMouse);
        dogs.forEach(moveDog);
        checkCollisions();
        draw();
      }, 520);
      raf = requestAnimationFrame(loop);
    }

    function loop() {
      if (!running) return;
      if (dir) {
        movePlayer(dir);
        dir = null;
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    function makeMice() {
      const spots = shuffle([
        { x: 17, y: 1 }, { x: 1, y: 11 }, { x: 17, y: 11 },
        { x: 9, y: 3 }, { x: 9, y: 9 }, { x: 3, y: 5 }
      ]).filter(isOpen);
      return Array.from({ length: total }, (_, index) => ({ ...spots[index % spots.length], memory: memoryList[index % memoryList.length] || {}, id: index }));
    }

    function makeDogs() {
      return shuffle([{ x: 17, y: 5 }, { x: 1, y: 7 }, { x: 15, y: 9 }]).filter(isOpen).slice(0, 2);
    }

    function isOpen(pos) {
      return pos.x >= 0 && pos.y >= 0 && pos.x < cols && pos.y < rows && baseMap[pos.y][pos.x] !== "#" && !blocks.has(key(pos));
    }

    function occupiedByMouse(pos) { return mice.some(m => m.x === pos.x && m.y === pos.y); }
    function occupiedByDog(pos) { return dogs.some(d => d.x === pos.x && d.y === pos.y); }
    function key(pos) { return `${pos.x},${pos.y}`; }

    function movePlayer(direction) {
      if (!running) return;
      const d = dirs[direction];
      if (!d) return;
      const next = { x: player.x + d.x, y: player.y + d.y };
      if (isOpen(next)) { player = next; playMoveSound(); }
      checkCollisions();
      draw();
    }

    function moveMouse(mouse) {
      const choices = neighbors(mouse).filter(isOpen).filter(p => !occupiedByDog(p));
      if (!choices.length) return;
      choices.sort((a, b) => distance(b, player) - distance(a, player));
      const safe = choices.slice(0, 2);
      const chosen = safe[Math.floor(Math.random() * safe.length)];
      mouse.x = chosen.x;
      mouse.y = chosen.y;
    }

    function moveDog(dog) {
      const choices = neighbors(dog).filter(isOpen).filter(p => !occupiedByDog(p));
      if (!choices.length) return;
      choices.sort((a, b) => distance(a, player) - distance(b, player));
      const chosen = choices[0];
      dog.x = chosen.x;
      dog.y = chosen.y;
    }

    function neighbors(pos) {
      return Object.values(dirs).map(d => ({ x: pos.x + d.x, y: pos.y + d.y }));
    }

    function distance(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function checkCollisions() {
      const found = mice.find(m => m.x === player.x && m.y === player.y);
      if (found) {
        caught += 1;
        playSound("powerupBlastSound", 0.30);
        playCollectSound();
        mice = mice.filter(m => m !== found);
        showMemory(found.memory, caught);
        burstConfetti(canvas.getBoundingClientRect().left + player.x * cell + 16, canvas.getBoundingClientRect().top + player.y * cell + 16, 14);
        if (caught >= total) win();
      }

      if (occupiedByDog(player) && Date.now() > invincibleUntil) {
        lives -= 1;
        playSound("dogBarkSound", 0.28);
        playBadSound();
        invincibleUntil = Date.now() + 1800;
        messageElement.textContent = lives > 0 ? "Dogblob hit. Temporary invincibility active." : "Game over! Press restart and try again.";
        if (lives <= 0) lose("Game over! Press restart and try again.");
      }
      updateHud();
    }

    function showMemory(memory, number) {
      revealElement.classList.add("hidden");
      messageElement.textContent = caught >= total ? "All mouseblobs caught!" : `Mouseblob ${number}/${total} caught. Keep going.`;
    }

    function win() {
      if (!running) return;
      running = false;
      won = true;
      stopTimers();
      messageElement.textContent = "Catblob Hunt complete. Key acquired.";
      overlay.classList.remove("hidden");
      overlay.querySelector("h3").textContent = "Key acquired!";
      overlay.querySelector("p").textContent = "Next stage unlocked. You can replay anytime.";
      startButton.textContent = "replay hunt 🔑";
      onWin();
      draw();
    }

    function lose(message) {
      running = false;
      stopTimers();
      messageElement.textContent = message;
      overlay.classList.remove("hidden");
      overlay.querySelector("h3").textContent = "Try again";
      overlay.querySelector("p").textContent = "Restart the hunt and protect your hearts.";
      startButton.textContent = "try again";
      draw();
    }

    function updateHud() {
      livesElement.innerHTML = Array.from({ length: 4 }, (_, i) => `<span class="heart ${i >= lives ? "empty" : ""}">♥</span>`).join("");
      caughtElement.textContent = `${String(caught).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
      timerElement.textContent = String(Math.max(0, time)).padStart(2, "0");
      timerElement.classList.toggle("danger", time <= 15);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackgroundTiles();
      drawBlocks();
      mice.forEach(drawMouseBlob);
      dogs.forEach(drawDogBlob);
      drawPlayer();
    }

    function drawBackgroundTiles() {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const wall = baseMap[y][x] === "#";
          ctx.fillStyle = wall ? "#9c6329" : "#fff4cc";
          roundRect(ctx, x * cell + 2, y * cell + 2, cell - 4, cell - 4, wall ? 8 : 12, true, false);
          if (!wall) {
            ctx.fillStyle = "rgba(255,183,190,.25)";
            ctx.beginPath();
            ctx.arc(x * cell + 16, y * cell + 16, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    function drawBlocks() {
      blocks.forEach(k => {
        const [x, y] = k.split(",").map(Number);
        ctx.fillStyle = "#ffb7be";
        roundRect(ctx, x * cell + 5, y * cell + 5, cell - 10, cell - 10, 9, true, false);
        ctx.strokeStyle = "#9c6329";
        ctx.lineWidth = 2;
        roundRect(ctx, x * cell + 5, y * cell + 5, cell - 10, cell - 10, 9, false, true);
      });
    }

    function drawPlayer() {
      const blink = Date.now() < invincibleUntil && Math.floor(Date.now() / 120) % 2 === 0;
      if (blink) return;
      const cx = player.x * cell + 16;
      const cy = player.y * cell + 16;
      ctx.fillStyle = "#ffe68f";
      ctx.strokeStyle = "#5d351b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#7b4726";
      roundRect(ctx, cx - 7, cy - 17, 14, 7, 6, true, false);
      ctx.fillStyle = "#5d351b";
      ctx.font = "bold 12px Trebuchet MS";
      ctx.fillText("•ᴥ•", cx - 11, cy + 6);
    }

    function drawMouseBlob(mouse) {
      const cx = mouse.x * cell + 16;
      const cy = mouse.y * cell + 16;
      ctx.fillStyle = "#fffdf5";
      ctx.strokeStyle = "#b7793b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffb7be";
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 8, 4, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5d351b";
      ctx.font = "11px Trebuchet MS";
      ctx.fillText("♡", cx - 4, cy + 4);
    }

    function drawDogBlob(dog) {
      const cx = dog.x * cell + 16;
      const cy = dog.y * cell + 16;
      ctx.fillStyle = "#b7793b";
      ctx.strokeStyle = "#5d351b";
      ctx.lineWidth = 2;
      roundRect(ctx, cx - 12, cy - 10, 24, 22, 10, true, true);
      ctx.fillStyle = "#5d351b";
      ctx.beginPath();
      ctx.arc(cx - 9, cy - 10, 5, 0, Math.PI * 2);
      ctx.arc(cx + 9, cy - 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4cc";
      ctx.font = "bold 11px Trebuchet MS";
      ctx.fillText("ಠ", cx - 8, cy + 4);
      ctx.fillText("ಠ", cx + 2, cy + 4);
    }

    function toggleBlock(event) {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / (rect.width / cols));
      const y = Math.floor((event.clientY - rect.top) / (rect.height / rows));
      const pos = { x, y };
      const k = key(pos);
      if (baseMap[y]?.[x] === "#") return;
      if (player.x === x && player.y === y) return;
      if (occupiedByMouse(pos) || occupiedByDog(pos)) return;
      if (blocks.has(k)) blocks.delete(k);
      else blocks.add(k);
      playBlockSound();
      draw();
    }

    function handleKey(event) {
      const keyName = event.key.toLowerCase();
      const map = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
      if (map[keyName]) {
        event.preventDefault();
        dir = map[keyName];
      }
    }

    function setDir(direction) { dir = direction; }
    const onCanvasPointer = event => toggleBlock(event);
    const onKey = event => handleKey(event);
    const onStart = () => start();
    const onReset = () => reset();

    canvas.addEventListener("pointerdown", onCanvasPointer);
    window.addEventListener("keydown", onKey);
    startButton.addEventListener("click", onStart);
    resetButton.addEventListener("click", onReset);
    dpadButtons.forEach(button => {
      const direction = button.dataset.dir;
      button.addEventListener("pointerdown", (event) => { event.preventDefault(); setDir(direction); });
      button.addEventListener("click", () => setDir(direction));
    });

    function stopTimers() {
      clearInterval(timer);
      clearInterval(npcTimer);
      cancelAnimationFrame(raf);
    }

    function stop() {
      stopTimers();
      canvas.removeEventListener("pointerdown", onCanvasPointer);
      window.removeEventListener("keydown", onKey);
      startButton.removeEventListener("click", onStart);
      resetButton.removeEventListener("click", onReset);
    }

    function shuffle(list) {
      return [...list].sort(() => Math.random() - 0.5);
    }

    reset();
    return { reset, stop };
  }

  function renderLetters(panel) {
    playPaperSound(); playSound("letterOpenSound", 0.18);
    const letters = state.data.letters.length ? state.data.letters : DEFAULT_DATA.letters;
    panel.innerHTML = `
      <p class="section-kicker">stage 7</p>
      <h2>Letter Lane</h2>
      <p>Games cleared. Open the editable letters below.</p>
      <div id="typeLine" class="type-line"></div>
      <div id="letterStack" class="letter-stack"></div>
      <div class="complete-row"><button id="letterDoneBtn" class="main-btn">Mark letters read</button><span class="success-bubble ${state.progress.done.includes(6) ? "" : "hidden"}">Stage complete ✓ golden key earned 🔑</span></div>
    `;
    const stack = byId("letterStack");
    letters.forEach((letter, index) => {
      const item = document.createElement("details");
      item.className = "letter-card";
      item.innerHTML = `<summary>${escapeHTML(letter.title || `Letter ${index + 1}`)}</summary><p>${escapeHTML(letter.body || "Write a letter here.")}</p>`;
      stack.appendChild(item);
    });
    typeText(byId("typeLine"), `Letters folder loaded. Read each note, then mark this stage complete.`);
    byId("letterDoneBtn").addEventListener("click", () => { playPaperSound(); playSound("letterOpenSound", 0.18); panel.querySelector(".success-bubble").classList.remove("hidden"); completeStage(6); });
  }

  function renderSudoku(panel) {
    panel.innerHTML = `
      <p class="section-kicker">stage 3</p>
      <h2>Sudoku Sweet Shop</h2>
      <p>Complete the 9x9 board, validate it, or use Solve for helper mode.</p>
      <div class="sudoku-stage-shell">
        <div id="sudokuHost" class="sudoku-host"></div>
        <div id="sudokuControls" class="sudoku-controls">
          <button type="button" class="btn primary" data-action="newGame">New Game</button>
          <button type="button" class="btn primary" data-action="solve">Solve</button>
          <button type="button" class="btn primary" data-action="validate">Validate</button>
        </div>
      </div>
      <p id="sudokuMessage" class="game-status">Tip: click a number to highlight matching numbers. Mobile keyboard works too.</p>
      ${stageDoneMarkup(2)}
    `;
    const game = createSudokuGame({ host: byId("sudokuHost"), controls: byId("sudokuControls"), messageElement: byId("sudokuMessage"), onWin: () => { panel.querySelector(".success-bubble").classList.remove("hidden"); completeStage(2); } });
    game.newGame();
  }

  function createSudokuGame({ host, controls, messageElement, onWin }) {
    let solution = [], puzzle = [], cells = [];
    const table = document.createElement("table");
    table.className = "sudoku-container";
    host.appendChild(table);
    function pattern(r,c){ return (r*3 + Math.floor(r/3) + c) % 9; }
    function shuffled(arr){ return [...arr].sort(()=>Math.random()-.5); }
    function makeSolution(){ const rows=[0,1,2].flatMap(g=>shuffled([0,1,2]).map(r=>g*3+r)); const cols=[0,1,2].flatMap(g=>shuffled([0,1,2]).map(c=>g*3+c)); const nums=shuffled([1,2,3,4,5,6,7,8,9]); return rows.map(r=>cols.map(c=>nums[pattern(r,c)])); }
    function build(){ table.innerHTML=""; cells=[]; for(let r=0;r<9;r++){ const tr=document.createElement("tr"); for(let c=0;c<9;c++){ const td=document.createElement("td"); const input=document.createElement("input"); input.maxLength=1; input.inputMode="numeric"; input.dataset.row=r; input.dataset.col=c; input.addEventListener("input",()=>{input.value=input.value.replace(/[^1-9]/g,"").slice(0,1); playTapSound(); playSound("pencilSound", 0.10); input.classList.remove("invalid"); table.classList.remove("valid-matrix");}); input.addEventListener("focus",()=>highlight(input.value)); input.addEventListener("click",()=>highlight(input.value)); td.appendChild(input); tr.appendChild(td); cells.push(input);} table.appendChild(tr);} }
    function fillPuzzle(){ cells.forEach((input,i)=>{ const r=Math.floor(i/9), c=i%9; input.value=puzzle[r][c]||""; input.disabled=!!puzzle[r][c]; input.classList.toggle("disabled",!!puzzle[r][c]); input.classList.remove("invalid","highlight");}); table.classList.remove("valid-matrix"); }
    function newGame(){ solution=makeSolution(); puzzle=solution.map(row=>row.slice()); shuffled([...Array(81).keys()]).slice(0,44).forEach(i=>puzzle[Math.floor(i/9)][i%9]=""); if(!cells.length) build(); fillPuzzle(); playGameStartSound(); messageElement.textContent="New Sudoku loaded. Complete the board."; }
    function solve(){ cells.forEach((input,i)=>{ const r=Math.floor(i/9), c=i%9; input.value=solution[r][c]; input.disabled=true; input.classList.add("disabled"); input.classList.remove("invalid");}); table.classList.add("valid-matrix"); playSound("sudokuOkSound", 0.3); messageElement.textContent="Solved. Helper mode complete."; onWin(); }
    function validate(){ let full=true, ok=true; cells.forEach((input,i)=>{ const r=Math.floor(i/9), c=i%9; const good=Number(input.value)===solution[r][c]; if(!input.value) full=false; input.classList.toggle("invalid",!!input.value&&!good); if(!good) ok=false;}); if(ok&&full){ table.classList.add("valid-matrix"); playSound("sudokuOkSound", 0.3); messageElement.textContent="Sudoku solved. Key acquired."; onWin(); } else if(!full){ playSound("sudokuWrongSound", 0.22); messageElement.textContent="Some boxes are still empty."; } else { playSound("sudokuWrongSound", 0.22); messageElement.textContent="Almost! Red boxes need another try."; } }
    function highlight(value){ cells.forEach(input=>input.classList.toggle("highlight",!!value&&input.value===value)); }
    controls.addEventListener("click", e=>{ const action=e.target?.dataset?.action; if(action==="newGame") newGame(); if(action==="solve") solve(); if(action==="validate") validate(); });
    return { newGame, solve, validate };
  }

  function renderPlatformer(panel) {
    panel.innerHTML = `
      <p class="section-kicker">stage 4</p>
      <h2>Pudding Stick Bridge</h2>
      <p>Hold to stretch the bridge. Release when it reaches the next platform. Reach 8 points.</p>
      <div class="png-art-row" aria-label="Pompompurin decorations">
        <img src="https://www.pngmart.com/files/23/Pompompurin-PNG-Isolated-Photo.png" alt="Pompompurin hugging a friend" loading="lazy">
        <img src="https://www.pngmart.com/files/23/Pompompurin-PNG-Pic.png" alt="Pompompurin heart decoration" loading="lazy">
        <img src="https://www.pngmart.com/files/23/Pompompurin-PNG-Isolated-Image.png" alt="Pompompurin face pattern" loading="lazy">
      </div>
      <div class="stick-hero-layout">
        <div class="stick-game-card pop-card">
          <div id="stickScore" class="stick-score">0</div>
          <canvas id="stickHeroGame" width="375" height="430" aria-label="Pudding Stick Bridge game"></canvas>
          <div id="stickIntro" class="stick-intro">Hold down to stretch a caramel stick bridge</div>
          <div id="stickPerfect" class="stick-perfect">DOUBLE SCORE</div>
          <button id="stickRestart" class="main-btn stick-restart">RESTART</button>
        </div>
        <p id="stickStatus" class="game-status">Mobile: press and hold anywhere on the game. PC: hold mouse, Space, or Enter.</p>
        <div class="puzzle-actions"><button id="stickResetBtn" class="ghost-btn">restart game</button></div>
      </div>
      ${stageDoneMarkup(3)}
    `;
    state.platformer = createStickHero({
      canvas: byId("stickHeroGame"),
      scoreElement: byId("stickScore"),
      introductionElement: byId("stickIntro"),
      perfectElement: byId("stickPerfect"),
      restartButton: byId("stickRestart"),
      status: byId("stickStatus"),
      onWin: () => {
        panel.querySelector(".success-bubble").classList.remove("hidden");
        completeStage(3);
      }
    });
    byId("stickResetBtn").addEventListener("click", () => state.platformer.reset());
  }

  function createStickHero({ canvas, scoreElement, introductionElement, perfectElement, restartButton, status, onWin }) {
    const ctx = canvas.getContext("2d");
    const targetScore = 8;

    let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
    let lastTimestamp;
    let heroX;
    let heroY;
    let sceneOffset;
    let platforms = [];
    let sticks = [];
    let trees = [];
    let score = 0;
    let raf = null;
    let completed = state.progress.done.includes(3);

    const gameWidth = 375;
    const gameHeight = 375;
    const platformHeight = 100;
    const heroDistanceFromEdge = 10;
    const paddingX = 100;
    const perfectAreaSize = 10;
    const backgroundSpeedMultiplier = 0.2;
    const hill1BaseHeight = 95;
    const hill1Amplitude = 12;
    const hill1Stretch = 1;
    const hill2BaseHeight = 68;
    const hill2Amplitude = 18;
    const hill2Stretch = 0.5;
    const stretchingSpeed = 4;
    const turningSpeed = 4;
    const walkingSpeed = 4;
    const transitioningSpeed = 2;
    const fallingSpeed = 2;
    const heroWidth = 24;
    const heroHeight = 30;

    const heroImage = new Image();
    heroImage.crossOrigin = "anonymous";
    heroImage.src = "https://www.pngmart.com/files/23/Pompompurin-PNG-Isolated-Photo.png";
    heroImage.addEventListener("load", draw);

    function last(list) {
      return list[list.length - 1];
    }

    function sinus(degree) {
      return Math.sin((degree / 180) * Math.PI);
    }

    function resizeCanvas() {
      const box = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(box.width || 375));
      canvas.height = canvas.width < 520 ? 420 : 450;
      draw();
    }

    function resetGame() {
      phase = "waiting";
      lastTimestamp = undefined;
      sceneOffset = 0;
      score = 0;
      introductionElement.style.opacity = 1;
      perfectElement.style.opacity = 0;
      restartButton.style.display = "none";
      scoreElement.textContent = score;
      status.textContent = "Mobile: press and hold anywhere on the game. PC: hold mouse, Space, or Enter.";

      platforms = [{ x: 50, w: 50 }];
      generatePlatform();
      generatePlatform();
      generatePlatform();
      generatePlatform();

      sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

      trees = [];
      for (let i = 0; i < 12; i++) generateTree();

      heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
      heroY = 0;
      draw();
    }

    function generateTree() {
      const minimumGap = 35;
      const maximumGap = 150;
      const lastTree = last(trees);
      const furthestX = lastTree ? lastTree.x : 0;
      const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
      const colors = ["#ffb7be", "#ffd86f", "#8fd9a8", "#9fd3ff"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const flower = ["🌼", "🌷", "💛", "🍮"][Math.floor(Math.random() * 4)];
      trees.push({ x, color, flower });
    }

    function generatePlatform() {
      const minimumGap = 42;
      const maximumGap = 185;
      const minimumWidth = 24;
      const maximumWidth = 104;
      const lastPlatform = last(platforms);
      const furthestX = lastPlatform.x + lastPlatform.w;
      const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
      const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
      platforms.push({ x, w });
    }

    function startStretch(event) {
      if (event) event.preventDefault();
      if (phase !== "waiting") return;
      lastTimestamp = undefined;
      introductionElement.style.opacity = 0;
      restartButton.style.display = "none";
      playSound("bridgeStretchSound", 0.20); playSound("windGustSound", 0.08);
      phase = "stretching";
      raf = window.requestAnimationFrame(animate);
    }

    function releaseStretch(event) {
      if (event) event.preventDefault();
      if (phase === "stretching") { playSound("bridgeReleaseSound", 0.22); phase = "turning"; }
    }

    function animate(timestamp) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        raf = window.requestAnimationFrame(animate);
        return;
      }

      switch (phase) {
        case "waiting":
          return;
        case "stretching":
          last(sticks).length += (timestamp - lastTimestamp) / stretchingSpeed;
          break;
        case "turning": {
          last(sticks).rotation += (timestamp - lastTimestamp) / turningSpeed;
          if (last(sticks).rotation > 90) {
            last(sticks).rotation = 90;
            const [nextPlatform, perfectHit] = thePlatformTheStickHits();
            if (nextPlatform) {
              score += perfectHit ? 2 : 1;
              playSound(perfectHit ? "bridgePerfectSound" : "bridgeLandSound", 0.28);
              scoreElement.textContent = score;
              status.textContent = perfectHit ? "Perfect crossing. Double score." : "Bridge cleared. Keep going.";
              if (perfectHit) {
                perfectElement.style.opacity = 1;
                setTimeout(() => (perfectElement.style.opacity = 0), 1000);
              }
              if (score >= targetScore && !completed) {
                completed = true;
                phase = "waiting";
                status.textContent = "Score target reached. Key acquired.";
                scoreElement.textContent = `${targetScore} ✓`;
                restartButton.style.display = "inline-flex";
                onWin();
                draw();
                return;
              }
              generatePlatform();
              generateTree();
              generateTree();
            }
            phase = "walking";
          }
          break;
        }
        case "walking": {
          heroX += (timestamp - lastTimestamp) / walkingSpeed;
          const [nextPlatform] = thePlatformTheStickHits();
          if (nextPlatform) {
            const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
            if (heroX > maxHeroX) {
              heroX = maxHeroX;
              phase = "transitioning";
            }
          } else {
            const maxHeroX = last(sticks).x + last(sticks).length + heroWidth;
            if (heroX > maxHeroX) {
              heroX = maxHeroX;
              phase = "falling";
              playSound("bridgeFallSound", 0.28);
              status.textContent = "Bridge missed.";
            }
          }
          break;
        }
        case "transitioning": {
          sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
          const [nextPlatform] = thePlatformTheStickHits();
          if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
            sticks.push({ x: nextPlatform.x + nextPlatform.w, length: 0, rotation: 0 });
            phase = "waiting";
          }
          break;
        }
        case "falling": {
          if (last(sticks).rotation < 180) last(sticks).rotation += (timestamp - lastTimestamp) / turningSpeed;
          heroY += (timestamp - lastTimestamp) / fallingSpeed;
          const maxHeroY = platformHeight + 120 + Math.max(0, (canvas.height - gameHeight) / 2);
          if (heroY > maxHeroY) {
            restartButton.style.display = "inline-flex";
            return;
          }
          break;
        }
        default:
          return;
      }

      draw();
      raf = window.requestAnimationFrame(animate);
      lastTimestamp = timestamp;
    }

    function thePlatformTheStickHits() {
      const stick = last(sticks);
      const stickFarX = stick.x + stick.length;
      const hit = platforms.find((platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w);
      const perfectHit = !!hit &&
        hit.x + hit.w / 2 - perfectAreaSize / 2 < stickFarX &&
        stickFarX < hit.x + hit.w / 2 + perfectAreaSize / 2;
      return [hit, perfectHit];
    }

    function draw() {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      ctx.translate((canvas.width - gameWidth) / 2 - sceneOffset, (canvas.height - gameHeight) / 2);
      drawPlatforms();
      drawHero();
      drawSticks();
      ctx.restore();
    }

    function drawPlatforms() {
      platforms.forEach(({ x, w }) => {
        const platformY = gameHeight - platformHeight;
        ctx.fillStyle = "#8b5727";
        roundRect(ctx, x, platformY, w, platformHeight + 120, 10, true, false);
        ctx.fillStyle = "#ffd86f";
        roundRect(ctx, x, platformY, w, 14, 10, true, false);
        ctx.strokeStyle = "#5d351b";
        ctx.lineWidth = 3;
        roundRect(ctx, x, platformY, w, platformHeight + 120, 10, false, true);

        if (last(sticks).x < x) {
          ctx.fillStyle = "#ffb7be";
          ctx.fillRect(x + w / 2 - perfectAreaSize / 2, platformY, perfectAreaSize, perfectAreaSize);
        }
      });
    }

    function drawHero() {
      ctx.save();
      ctx.translate(heroX - heroWidth / 2, heroY + gameHeight - platformHeight - heroHeight / 2);
      if (heroImage.complete && heroImage.naturalWidth > 0) {
        ctx.drawImage(heroImage, -23, -30, 48, 48);
      } else {
        ctx.fillStyle = "#ffe68f";
        ctx.strokeStyle = "#5d351b";
        ctx.lineWidth = 3;
        roundRect(ctx, -heroWidth / 2, -heroHeight / 2, heroWidth + 8, heroHeight - 2, 9, true, true);
        ctx.fillStyle = "#5d351b";
        ctx.font = "16px Trebuchet MS";
        ctx.fillText("•ᴥ•", -11, 5);
        ctx.fillStyle = "#7b4726";
        roundRect(ctx, -4, -22, 16, 8, 6, true, false);
      }
      ctx.restore();
    }

    function drawSticks() {
      sticks.forEach((stick) => {
        ctx.save();
        ctx.translate(stick.x, gameHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#6f3f1d";
        ctx.lineCap = "round";
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();
        ctx.restore();
      });
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#fff8df");
      gradient.addColorStop(0.42, "#fff0bd");
      gradient.addColorStop(1, "#ffd86f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fffdf5";
      roundRect(ctx, 26, 38, 95, 30, 18, true, false);
      roundRect(ctx, canvas.width - 145, 58, 118, 34, 20, true, false);
      ctx.restore();

      drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#f8c654");
      drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#b7793b");
      trees.forEach((tree) => drawTree(tree.x, tree.color, tree.flower));

      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.font = "22px serif";
      ctx.fillText("♡", 24 + sinus(sceneOffset) * 5, 110);
      ctx.fillText("♪", canvas.width - 50, 145 + sinus(sceneOffset * .7) * 4);
      ctx.fillText("★", canvas.width * .58, 70);
      ctx.restore();
    }

    function drawHill(baseHeight, amplitude, stretch, color) {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
      for (let i = 0; i <= canvas.width; i += 2) {
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function drawTree(x, color, flower) {
      ctx.save();
      ctx.translate((-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, getTreeY(x, hill1BaseHeight, hill1Amplitude));
      ctx.fillStyle = "#7d5a31";
      ctx.fillRect(-2, -14, 4, 16);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -18, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "16px serif";
      ctx.fillText(flower, -9, -13);
      ctx.restore();
    }

    function getHillY(windowX, baseHeight, amplitude, stretch) {
      const sineBaseY = canvas.height - baseHeight;
      return sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + sineBaseY;
    }

    function getTreeY(x, baseHeight, amplitude) {
      const sineBaseY = canvas.height - baseHeight;
      return sinus(x) * amplitude + sineBaseY;
    }

    function handleKey(event) {
      if (![" ", "enter"].includes(event.key.toLowerCase())) return;
      event.preventDefault();
      if (event.type === "keydown") startStretch(event);
      if (event.type === "keyup") releaseStretch(event);
    }

    const onPointerDown = (event) => startStretch(event);
    const onPointerUp = (event) => releaseStretch(event);
    const onKeyDown = (event) => handleKey(event);
    const onKeyUp = (event) => handleKey(event);
    const onResize = () => resizeCanvas();
    const onRestart = (event) => {
      event.preventDefault();
      resetGame();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    restartButton.addEventListener("click", onRestart);

    resizeCanvas();
    resetGame();

    return {
      reset: resetGame,
      stop() {
        cancelAnimationFrame(raf);
        canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("resize", onResize);
        restartButton.removeEventListener("click", onRestart);
      }
    };
  }

  function renderMarblePop(panel) {
    panel.innerHTML = `
      <p class="section-kicker">stage 5</p>
      <h2>Pudding Marble Pop</h2>
      <p>Aim at the marble chain, shoot colors, and match 3 or more. Reach 24 points.</p>
      <div class="marble-os-hud">
        <div><span class="hud-label">score</span><strong id="marbleScore">0</strong></div>
        <div><span class="hud-label">goal</span><strong>24</strong></div>
        <div><span class="hud-label">next</span><strong id="marbleNextDot">●</strong></div>
      </div>
      <div class="marble-game-shell pop-card">
        <canvas id="marbleCanvas" class="marble-canvas" width="900" height="540" aria-label="Pudding Marble Pop game"></canvas>
        <div id="marbleOverlay" class="marble-overlay">
          <div class="pudding-pup small" aria-hidden="true"><span class="ear left"></span><span class="ear right"></span><span class="hat"></span><span class="face">•ᴥ•</span></div>
          <h3>Pudding Marble Pop</h3>
          <p>PC: move mouse to aim, click to shoot, Space to switch. Mobile: tap where you want to shoot, use the switch button.</p>
          <button id="marbleStart" class="main-btn">start marble ride 🟡</button>
        </div>
      </div>
      <div class="puzzle-actions">
        <button id="marbleSwitch" class="ghost-btn">switch marble color</button>
        <button id="marbleRestart" class="ghost-btn">restart marble ride</button>
      </div>
      <p id="marbleMessage" class="game-status">Match 3 colors to pop them. Protect the heart hole.</p>
      ${stageDoneMarkup(4)}
    `;

    state.marbleGame = createMarblePopGame({
      canvas: byId("marbleCanvas"),
      scoreElement: byId("marbleScore"),
      nextElement: byId("marbleNextDot"),
      messageElement: byId("marbleMessage"),
      overlay: byId("marbleOverlay"),
      startButton: byId("marbleStart"),
      switchButton: byId("marbleSwitch"),
      restartButton: byId("marbleRestart"),
      onWin: () => {
        panel.querySelector(".success-bubble").classList.remove("hidden");
        completeStage(4);
      }
    });
  }

  function createMarblePopGame({ canvas, scoreElement, nextElement, messageElement, overlay, startButton, switchButton, restartButton, onWin }) {
    const ctx = canvas.getContext("2d");
    const W = 900;
    const H = 540;
    const radius = 16;
    const gap = radius * 2 + 5;
    const goalScore = 500;
    const player = { x: W / 2, y: H / 2 + 8 };
    const colors = ["#ffd86f", "#ffb7be", "#8fd9a8", "#9fd3ff"];
    const pathPoints = [
      { x: 70, y: 92 }, { x: 785, y: 92 }, { x: 820, y: 205 },
      { x: 122, y: 205 }, { x: 95, y: 318 }, { x: 760, y: 318 },
      { x: 790, y: 432 }, { x: 210, y: 432 }, { x: 450, y: 270 }
    ];
    const segments = [];
    let pathLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const a = pathPoints[i];
      const b = pathPoints[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({ a, b, start: pathLength, len });
      pathLength += len;
    }

    let running = false;
    let won = state.progress.done.includes(4);
    let raf = null;
    let marbles = [];
    let shots = [];
    let score = 0;
    let tick = 0;
    let currentColor = randomColor();
    let nextColor = randomColor();
    let aim = { x: player.x, y: player.y - 120 };

    canvas.width = W;
    canvas.height = H;

    function randomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function reset() {
      stopLoop();
      running = false;
      marbles = [];
      shots = [];
      score = 0;
      tick = 0;
      currentColor = randomColor();
      nextColor = randomColor();
      for (let i = 0; i < 16; i++) {
        marbles.push({ id: cryptoId(), dist: i * gap * 0.98, color: colors[Math.floor(i / 2) % colors.length] });
      }
      overlay.classList.remove("hidden");
      startButton.textContent = won ? "replay marble ride 🟡" : "start marble ride 🟡";
      messageElement.textContent = "Match 3 colors to pop them. Protect the heart hole.";
      updateHud();
      draw();
    }

    function cryptoId() {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function start() {
      if (running) return;
      playGameStartSound();
      running = true;
      overlay.classList.add("hidden");
      messageElement.textContent = "Objective active: aim, shoot, and match colors.";
      raf = requestAnimationFrame(loop);
    }

    function stopLoop() {
      cancelAnimationFrame(raf);
    }

    function loop() {
      if (!running) return;
      tick++;
      updateChain();
      updateShots();
      draw();
      raf = requestAnimationFrame(loop);
    }

    function updateChain() {
      const speed = 0.34 + Math.min(score / 220, 0.18);
      marbles.forEach(m => m.dist += speed);
      marbles.sort((a, b) => a.dist - b.dist);
      for (let i = 1; i < marbles.length; i++) {
        if (marbles[i].dist - marbles[i - 1].dist < gap) {
          marbles[i].dist = marbles[i - 1].dist + gap;
        }
      }
      if (tick % 140 === 0 && marbles.length < 30) {
        const first = marbles[0];
        if (!first || first.dist > gap * 1.25) {
          marbles.unshift({ id: cryptoId(), dist: 0, color: randomColor() });
        }
      }
      const ender = marbles[marbles.length - 1];
      if (ender && ender.dist >= pathLength - 10) lose("The chain reached the end. Restart and try again.");
    }

    function updateShots() {
      for (let s = shots.length - 1; s >= 0; s--) {
        const shot = shots[s];
        shot.x += shot.vx;
        shot.y += shot.vy;
        if (shot.x < -50 || shot.x > W + 50 || shot.y < -50 || shot.y > H + 50) {
          shots.splice(s, 1);
          continue;
        }
        for (let i = 0; i < marbles.length; i++) {
          const pos = pointAt(marbles[i].dist);
          if (Math.hypot(shot.x - pos.x, shot.y - pos.y) < radius * 2) {
            insertShot(shot, i);
            shots.splice(s, 1);
            break;
          }
        }
      }
    }

    function insertShot(shot, hitIndex) {
      const target = marbles[hitIndex];
      const insertDist = target.dist + gap * 0.55;
      const newMarble = { id: cryptoId(), dist: insertDist, color: shot.color };
      marbles.splice(hitIndex + 1, 0, newMarble);
      marbles.sort((a, b) => a.dist - b.dist);
      normalizeSpacing();
      const insertedIndex = marbles.findIndex(m => m.id === newMarble.id);
      const popped = popMatches(insertedIndex);
      if (popped === 0) {
        score += 1;
        messageElement.textContent = "Hit confirmed. Make 3 matching colors touch to pop faster.";
        updateHud();
        if (score >= goalScore) win();
      }
    }

    function normalizeSpacing() {
      marbles.sort((a, b) => a.dist - b.dist);
      for (let i = 1; i < marbles.length; i++) {
        if (marbles[i].dist - marbles[i - 1].dist < gap) {
          marbles[i].dist = marbles[i - 1].dist + gap;
        }
      }
    }

    function popMatches(index) {
      if (index < 0 || !marbles[index]) return 0;
      const color = marbles[index].color;
      let left = index;
      let right = index;
      while (left - 1 >= 0 && marbles[left - 1].color === color && marbles[left].dist - marbles[left - 1].dist <= gap * 1.45) left--;
      while (right + 1 < marbles.length && marbles[right + 1].color === color && marbles[right + 1].dist - marbles[right].dist <= gap * 1.45) right++;
      const count = right - left + 1;
      if (count >= 3) {
        marbles.splice(left, count);
        playSound("marblePopSound", 0.32); if (count >= 4) playSound("comboSound", 0.24);
        score += count * 4;
        messageElement.textContent = `Pop! ${count} marbles cleared.`;
        burstConfetti(canvas.getBoundingClientRect().left + canvas.clientWidth / 2, canvas.getBoundingClientRect().top + canvas.clientHeight / 2, 10);
        updateHud();
        if (score >= goalScore) win();
        return count;
      }
      updateHud();
      return 0;
    }

    function shoot(targetX, targetY) {
      if (!running) return;
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const speed = 9.2;
      playSound("marbleShootSound", 0.24);
      shots.push({ x: player.x, y: player.y, vx: (dx / length) * speed, vy: (dy / length) * speed, color: currentColor });
      currentColor = nextColor;
      nextColor = randomColor();
      updateHud();
    }

    function switchColor() {
      playSound("marbleSwitchSound", 0.22);
      [currentColor, nextColor] = [nextColor, currentColor];
      updateHud();
    }

    function win() {
      if (won && state.progress.done.includes(4)) {
        messageElement.textContent = "You already have this golden key. Replay anytime!";
        return;
      }
      won = true;
      running = false;
      stopLoop();
      overlay.classList.remove("hidden");
      overlay.querySelector("h3").textContent = "Golden key collected!";
      overlay.querySelector("p").textContent = "Marble Pop cleared. Key acquired.";
      startButton.textContent = "play again";
      messageElement.textContent = "Marble Pop complete.";
      onWin();
    }

    function lose(message) {
      running = false;
      stopLoop();
      overlay.classList.remove("hidden");
      overlay.querySelector("h3").textContent = "Try again";
      overlay.querySelector("p").textContent = message;
      startButton.textContent = "restart marble ride";
      messageElement.textContent = message;
      playBadSound();
    }

    function pointAt(distance) {
      const d = Math.max(0, Math.min(pathLength, distance));
      const seg = segments.find(s => d <= s.start + s.len) || segments[segments.length - 1];
      const t = Math.max(0, Math.min(1, (d - seg.start) / seg.len));
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t
      };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawBackground();
      drawPath();
      marbles.forEach(drawMarble);
      shots.forEach(drawShot);
      drawPlayer();
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, "#fff8df");
      gradient.addColorStop(0.6, "#fff0bd");
      gradient.addColorStop(1, "#ffd86f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = i % 2 ? "#ffb7be" : "#fffdf5";
        ctx.beginPath();
        ctx.arc((i * 91) % W, 40 + ((i * 53) % 450), 10 + (i % 4) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawPath() {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      pathPoints.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = "#9c6329";
      ctx.lineWidth = 55;
      ctx.stroke();
      ctx.beginPath();
      pathPoints.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = "#ffe4a0";
      ctx.lineWidth = 43;
      ctx.stroke();
      const start = pointAt(0);
      const end = pointAt(pathLength);
      drawHole(start.x, start.y, "start");
      drawHole(end.x, end.y, "♡");
    }

    function drawHole(x, y, label) {
      ctx.fillStyle = "#5d351b";
      ctx.beginPath();
      ctx.arc(x, y, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff8df";
      ctx.font = "bold 17px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 6);
    }

    function drawMarble(marble) {
      const p = pointAt(marble.dist);
      ctx.fillStyle = marble.color;
      ctx.strokeStyle = "#5d351b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#fffdf5";
      ctx.beginPath();
      ctx.arc(p.x - 5, p.y - 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawShot(shot) {
      ctx.fillStyle = shot.color;
      ctx.strokeStyle = "#5d351b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, radius - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    function drawPlayer() {
      const angle = Math.atan2(aim.y - player.y, aim.x - player.x);
      ctx.save();
      ctx.strokeStyle = "rgba(93,53,27,.35)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(angle) * 92, player.y + Math.sin(angle) * 92);
      ctx.stroke();
      ctx.translate(player.x, player.y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = "#ffe68f";
      ctx.strokeStyle = "#5d351b";
      ctx.lineWidth = 4;
      roundRect(ctx, -31, -28, 62, 58, 24, true, true);
      ctx.fillStyle = "#9c6329";
      roundRect(ctx, -14, -43, 28, 15, 9, true, false);
      ctx.fillStyle = currentColor;
      ctx.strokeStyle = "#5d351b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -57, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#5d351b";
      ctx.font = "bold 20px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("•ᴥ•", player.x, player.y + 8);
    }

    function updateHud() {
      scoreElement.textContent = String(score);
      nextElement.style.color = nextColor;
      nextElement.textContent = "●";
    }

    function localPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * W,
        y: ((event.clientY - rect.top) / rect.height) * H
      };
    }

    const onPointerMove = event => {
      aim = localPoint(event);
      if (!running) draw();
    };
    const onPointerDown = event => {
      event.preventDefault();
      const p = localPoint(event);
      aim = p;
      shoot(p.x, p.y);
    };
    const onKey = event => {
      if (event.code === "Space") {
        event.preventDefault();
        switchColor();
        draw();
      }
    };
    const onStart = () => {
      overlay.querySelector("h3").textContent = "Pudding Marble Pop";
      overlay.querySelector("p").textContent = "PC: move mouse to aim, click to shoot, Space to switch. Mobile: tap where you want to shoot, use the switch button.";
      if (!running) start();
    };
    const onSwitch = () => { switchColor(); draw(); };
    const onRestart = () => { reset(); start(); };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    startButton.addEventListener("click", onStart);
    switchButton.addEventListener("click", onSwitch);
    restartButton.addEventListener("click", onRestart);

    reset();

    return {
      reset,
      stop() {
        stopLoop();
        running = false;
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("keydown", onKey);
        startButton.removeEventListener("click", onStart);
        switchButton.removeEventListener("click", onSwitch);
        restartButton.removeEventListener("click", onRestart);
      }
    };
  }


  function renderFinalFight(panel) {
    panel.innerHTML = `
      <p class="section-kicker">stage 6 · final boss</p>
      <h2>Pompom vs Capybara Final Fight</h2>
      <p>Best-of-3 turn battle. Win 2 rounds to unlock the next stage.</p>
      <div class="fight-hud">
        <div><span class="hud-label">round</span><strong id="fightRound">1</strong></div>
        <div><span class="hud-label">score</span><strong id="fightScore">0 - 0</strong></div>
        <div><span class="hud-label">turn</span><strong id="fightTurn">Pompom</strong></div>
      </div>
      <div class="fight-shell pop-card" id="fightShell">
        <div class="fight-topbar"><span>FINALFIGHT.EXE</span><span id="fightTimer">Best of 3</span></div>
        <div class="hp-row">
          <div class="hp-wrap"><b>Pompom</b><div class="hp-track"><span id="pomHp"></span></div></div>
          <div class="round-badge" id="roundBadge">ROUND 1</div>
          <div class="hp-wrap"><b>Capybara</b><div class="hp-track"><span id="capyHp"></span></div></div>
        </div>
        <div class="arena">
          <div id="pomFighter" class="fighter pom"><div class="fighter-shadow"></div><div class="pom-body"><span class="pom-ear left"></span><span class="pom-ear right"></span><span class="pom-hat"></span><span class="pom-face">•ᴥ•</span></div></div>
          <div class="arena-message" id="fightMessage">Press Start Fight. Win 2 rounds.</div>
          <div id="capyFighter" class="fighter capy"><div class="fighter-shadow"></div><div class="capy-body"><span class="capy-ear left"></span><span class="capy-ear right"></span><span class="capy-face">•‿•</span></div></div>
        </div>
        <div class="fight-controls">
          <button id="fightPunch" class="main-btn">Punch J</button>
          <button id="fightKick" class="main-btn">Kick K</button>
          <button id="fightHeart" class="main-btn">Heart L</button>
          <button id="fightBlock" class="ghost-btn">Block S</button>
        </div>
        <div class="fight-actions">
          <button id="fightStart" class="main-btn">start fight 🥊</button>
          <button id="fightRestart" class="ghost-btn">restart match</button>
        </div>
      </div>
      <p class="game-status">Final boss: win two rounds to clear the stage.</p>
      ${stageDoneMarkup(5)}
    `;
    state.finalFightGame = createFinalFightGame({
      panel,
      onWin: () => { panel.querySelector(".success-bubble")?.classList.remove("hidden"); completeStage(5); }
    });
  }

  function createFinalFightGame({ panel, onWin }) {
    const els = {
      round: byId("fightRound"), score: byId("fightScore"), turn: byId("fightTurn"), timer: byId("fightTimer"),
      pomHp: byId("pomHp"), capyHp: byId("capyHp"), message: byId("fightMessage"), badge: byId("roundBadge"),
      pom: byId("pomFighter"), capy: byId("capyFighter"), shell: byId("fightShell"),
      start: byId("fightStart"), restart: byId("fightRestart"),
      punch: byId("fightPunch"), kick: byId("fightKick"), heart: byId("fightHeart"), block: byId("fightBlock")
    };
    let round = 1, pomWins = 0, capyWins = 0, active = false, busy = false, ended = false;
    let pomHp = 100, capyHp = 100, blocking = false;
    const actions = {
      punch: { label: "Pudding Punch", damage: [13, 19], acc: .92, anim: "punch" },
      kick: { label: "Caramel Kick", damage: [17, 25], acc: .78, anim: "kick" },
      heart: { label: "Power Blast", damage: [18, 32], acc: .72, anim: "heart" },
      block: { label: "Guard", damage: [0, 0], acc: 1, anim: "block" }
    };
    function rand(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
    function setMessage(msg) { els.message.textContent = msg; }
    function update() {
      els.round.textContent = String(round);
      els.badge.textContent = `ROUND ${round}`;
      els.score.textContent = `${pomWins} - ${capyWins}`;
      els.pomHp.style.width = `${clamp(pomHp, 0, 100)}%`;
      els.capyHp.style.width = `${clamp(capyHp, 0, 100)}%`;
      els.turn.textContent = busy ? "..." : active ? "Pompom" : "Ready";
      [els.punch, els.kick, els.heart, els.block].forEach(btn => btn.disabled = !active || busy || ended);
    }
    function playRound() { playSound("roundBellSound", .28); playSound(`round${round}Sound`, .55); }
    function startRound(newMatch = false) {
      if (newMatch) { round = 1; pomWins = 0; capyWins = 0; ended = false; }
      pomHp = 100; capyHp = 100; blocking = false; busy = false; active = true;
      els.shell.classList.remove("match-over");
      playRound();
      setMessage(`Round ${round}. Choose an action.`);
      update();
    }
    function endRound(winner) {
      active = false; busy = true;
      if (winner === "pom") { pomWins++; setMessage(`Round ${round} won.`); }
      else { capyWins++; setMessage(`Capybara won round ${round}. Next round starting.`); }
      playKoSound();
      update();
      setTimeout(() => {
        if (pomWins >= 2) return finishMatch(true);
        if (capyWins >= 2) return finishMatch(false);
        round += 1;
        startRound(false);
      }, 1500);
    }
    function finishMatch(playerWon) {
      ended = true; active = false; busy = false;
      els.shell.classList.add("match-over");
      if (playerWon) {
        setMessage("K.O.! Best-of-3 cleared.");
        onWin();
      } else {
        setMessage("Capybara won this match. Press restart and try again.");
      }
      update();
    }
    function damageTarget(target, amount) {
      if (target === "capy") { capyHp = clamp(capyHp - amount, 0, 100); els.capy.classList.add("hurt"); setTimeout(()=>els.capy.classList.remove("hurt"), 320); }
      else { pomHp = clamp(pomHp - amount, 0, 100); els.pom.classList.add("hurt"); setTimeout(()=>els.pom.classList.remove("hurt"), 320); }
      if (amount > 0) playHitSound();
      update();
    }
    function animateActor(actor, cls) {
      actor.classList.remove("punch", "kick", "heart", "block");
      void actor.offsetWidth;
      actor.classList.add(cls);
      setTimeout(() => actor.classList.remove(cls), 520);
    }
    function playerMove(type) {
      if (!active || busy || ended) return;
      busy = true; blocking = false; update();
      const action = actions[type];
      animateActor(els.pom, action.anim);
      if (type === "punch") playSound("punchSound", 0.28);
      if (type === "kick") playSound("kickSound", 0.28);
      if (type === "heart") playSound("powerupBlastSound", 0.42);
      if (type === "block") {
        blocking = true; playSound("blockGuardSound", 0.26); setMessage("Pompom used Guard. Next hit is reduced.");
      } else if (Math.random() <= action.acc) {
        const amount = rand(action.damage[0], action.damage[1]);
        damageTarget("capy", amount);
        setMessage(`${action.label}! Capybara took ${amount} damage.`);
      } else {
        setMessage(`${action.label} missed! Capybara waddled away.`);
      }
      if (capyHp <= 0) return setTimeout(() => endRound("pom"), 650);
      setTimeout(enemyMove, 900);
    }
    function enemyMove() {
      if (!active || ended) return;
      const pool = ["Nibble Counter", "Capybara Slam", "Orange Splash"];
      const name = pool[rand(0, pool.length - 1)];
      const enemyAnim = rand(0,1) ? "punch" : "kick"; animateActor(els.capy, enemyAnim); playSound(enemyAnim === "punch" ? "punchSound" : "kickSound", 0.18);
      let dmg = rand(10, 22);
      if (blocking) dmg = Math.floor(dmg * .35);
      if (Math.random() < .16) { setMessage(`${name} missed. Pompom dodged.`); }
      else { damageTarget("pom", dmg); setMessage(`${name}! Pompom took ${dmg} damage${blocking ? " after blocking" : ""}.`); }
      blocking = false;
      if (pomHp <= 0) return setTimeout(() => endRound("capy"), 650);
      busy = false; update();
    }
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (key === "j") playerMove("punch");
      if (key === "k") playerMove("kick");
      if (key === "l") playerMove("heart");
      if (key === "s" || key === "arrowdown") playerMove("block");
    };
    els.start.addEventListener("click", () => startRound(true));
    els.restart.addEventListener("click", () => startRound(true));
    els.punch.addEventListener("click", () => playerMove("punch"));
    els.kick.addEventListener("click", () => playerMove("kick"));
    els.heart.addEventListener("click", () => playerMove("heart"));
    els.block.addEventListener("click", () => playerMove("block"));
    window.addEventListener("keydown", onKey);
    update();
    return { stop() { window.removeEventListener("keydown", onKey); active = false; busy = false; } };
  }

  function ordinal(n) { return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`; }

  function renderFinale(panel) {
    playSound("fireworkPopSound", 0.25);
    panel.classList.remove("stage-panel");
    panel.classList.add("finale-card");
    panel.innerHTML = `
      <p class="section-kicker">final stage</p>
      <h2>Finale Castle</h2>
      <div class="pudding-pup big" aria-hidden="true"><span class="ear left"></span><span class="ear right"></span><span class="hat"></span><span class="face">•ᴥ•</span></div>
      <p class="finale-message">${escapeHTML(state.data.finalMessage)}</p>
      <div class="complete-row" style="justify-content:center"><button id="fireworkBtn" class="main-btn">more fireworks 🎆</button><span class="success-bubble ${state.progress.done.includes(STAGES.length - 1) ? "" : "hidden"}">Whole quest complete ✓</span></div>
    `;
    completeStage(STAGES.length - 1);
    playFireworksSound();
    byId("fireworkBtn").addEventListener("click", () => {
      playFireworksSound();
      for (let i = 0; i < 8; i++) {
        setTimeout(() => burstConfetti(Math.random() * window.innerWidth, 120 + Math.random() * 280, 18), i * 120);
      }
    });
  }

  function installAudioPolish() {
    if (window.__puddingAudioPolishInstalled) return;
    window.__puddingAudioPolishInstalled = true;
    document.addEventListener("click", (event) => {
      const clickable = event.target.closest("button, a, summary, input[type=button], input[type=submit]");
      if (clickable && !clickable.closest(".blue-screen")) playSound("uiClickSound", 0.28);
    }, true);
    let lastHover = 0;
    document.addEventListener("pointerover", (event) => {
      const hoverable = event.target.closest("button, .stage-card, .desktop-icon, summary");
      const now = Date.now();
      if (hoverable && now - lastHover > 90) { lastHover = now; playSound("uiHoverSound", 0.12); }
    }, true);
  }

  function startStageAmbience(index) {
    const bgms = [
      "bgRoadSound", "bgCatblobSound", "bgSudokuSound", "bgBridgeSound",
      "bgMarbleSound", "bgFightSound", "bgLettersSound", "bgFinaleSound"
    ];
    const volumes = [0.10, 0.085, 0.075, 0.082, 0.095, 0.10, 0.065, 0.095];
    const id = bgms[index];
    if (!id) return;
    stopStageAmbience();
    const audio = byId(id);
    if (!audio) return;
    currentStageAmbience = audio;
    audio.volume = volumes[index] ?? 0.06;
    audio.loop = true;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stopStageAmbience() {
    if (!currentStageAmbience) return;
    try { currentStageAmbience.pause(); currentStageAmbience.currentTime = 0; } catch { }
    currentStageAmbience = null;
  }

  function playOpenSound() { playSound("openSound", 0.48); }
  function playVictorySound() { playSound("victorySound", 0.55); }
  function playFireworksSound() { playSound("fireworksSound", 0.5); playSound("fireworkPopSound", 0.28); }
  function playHitSound() { playSound("hitSound", 0.45); }
  function playKoSound() { playSound("koSound", 0.52); }
  function playGameStartSound() { playSound("gameStartSound", 0.28); }
  function playCollectSound() { playSound("collectSound", 0.32); }
  function playBadSound() { playSound("badSound", 0.25); }
  function playBlockSound() { playSound("blockSound", 0.22); }
  function playMoveSound() { playSound("moveSound", 0.14); }
  function playTapSound() { playSound("tapSound", 0.16); }
  function playPaperSound() { playSound("paperSound", 0.18); }
  function playSound(id, volume = 0.35) { const audio = byId(id); if (!audio) return; try { audio.currentTime = 0; audio.volume = volume; audio.play().catch(() => {}); } catch { } }
  function startThemeMusic() {
    const audio = byId("themeMusic");
    if (!audio || audio.dataset.started === "yes") return;
    audio.dataset.started = "yes";
    audio.volume = 0.03;
    audio.loop = true;
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    document.addEventListener("pointerdown", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay, { once: true });
  }
  function showStageMessage(index) { const message = STAGE_WIN_MESSAGES[index]; if (!message) return; const toast = document.createElement("div"); toast.className = "ldr-toast pop-card"; toast.innerHTML = `<b>Golden key saved 🔑</b><p>${escapeHTML(message)}</p>`; document.body.appendChild(toast); setTimeout(() => toast.classList.add("show"), 20); setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 450); }, 4300); }
  function installPuddingOS() {
    const layer = byId("osWindowLayer");
    document.querySelectorAll(".desktop-icon[data-os-app]").forEach((icon) => {
      const app = icon.dataset.osApp;
      const open = () => openPuddingApp(app);
      icon.addEventListener("click", open);
      icon.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    document.querySelector(".task-search")?.addEventListener("click", () => openPuddingApp("Search"));
    document.querySelector(".task-start")?.addEventListener("click", () => openPuddingStartMenu());
    byId("taskSoundBtn")?.addEventListener("click", () => openSoundMenu());
    setInterval(() => {
      const status = document.querySelector(".task-status");
      if (status) status.textContent = `🔋 100%   Wi‑Fi   ${new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
    }, 1000);
  }

  function openPuddingApp(app) {
    if (app === "Games") return openPuddingGamesApp();
    if (app === "YouTube") return openYouTubeApp();
    if (app === "Update") return openUpdatePrank();
    if (app === "Surprises") return openSurprisesApp();
    if (app === "Love") return openSimpleOSWindow("Notes.exe", `<h2>Notes.exe</h2><p>Status: Running normally.</p><p>CPU usage: Stable.</p>`);
    if (app === "Files") return openSimpleOSWindow("Files", `<h2>Files</h2><div class="file-list"><button data-open-folder="games">🎮 games.folder</button><button data-open-folder="memories">📸 memories.folder</button><button data-open-folder="letters">💌 letters-after-games.txt</button></div>`);
    if (app === "Search") return openSimpleOSWindow("Search", `<h2>Pudding Search</h2><p>Search query: Pudding Park status</p><p>Result: All systems ready.</p>`);
  }

  function openPuddingStartMenu() {
    openSimpleOSWindow("Start", `<h2>Pudding OS Start</h2><div class="start-tiles"><button data-start-app="Games">🎮 Games</button><button data-start-app="YouTube">▶ YouTube</button><button data-start-app="Surprises">🔒 Surprises</button><button data-start-app="Update">⚙️ Update.exe</button></div>`);
    setTimeout(() => document.querySelectorAll("[data-start-app]").forEach(btn => btn.addEventListener("click", () => openPuddingApp(btn.dataset.startApp))), 0);
  }

  function osWindowShell(title, bodyHTML, extraClass = "") {
    return `<div class="os-window modern-os-window ${extraClass}"><div class="os-titlebar"><div><span class="os-dot red"></span><span class="os-dot yellow"></span><span class="os-dot green"></span><b>${escapeHTML(title)}</b></div><button class="os-close" type="button" aria-label="close">×</button></div><div class="os-window-body">${bodyHTML}</div></div>`;
  }

  function setOSWindow(title, bodyHTML, extraClass = "") {
    const layer = byId("osWindowLayer");
    if (!layer) return;
    playOpenSound();
    layer.classList.remove("hidden");
    layer.innerHTML = osWindowShell(title, bodyHTML, extraClass);
    layer.querySelector(".os-close")?.addEventListener("click", () => layer.classList.add("hidden"));
  }

  function openSimpleOSWindow(title, html) {
    showPuddingLoader(`Opening ${title}...`, () => setOSWindow(title, html), 430);
  }

  function openPuddingGamesApp() {
    showPuddingLoader("Opening Games.exe...", () => {
      setOSWindow("Games.exe", gamesHubHTML(), "games-window");
      wireGamesHub();
    }, 520);
  }

  function gamesHubHTML() {
    return `<div class="games-app"><div class="games-app-head"><div><p class="section-kicker">Pudding Station</p><h2>Choose a level</h2><p>Move sideways like a console menu. Locked games open after you earn the golden key before them.</p></div><div class="key-counter">🔑 ${state.progress.done.length}/${STAGES.length}</div></div><div class="game-carousel" id="gameCarousel">${STAGES.map((stage, index) => {
      const unlocked = index <= state.progress.unlocked;
      const done = state.progress.done.includes(index);
      const images = ["🌼", "🐾", "🔢", "🌉", "🟡", "🥊", "💌", "🎆"];
      return `<article class="game-slide ${unlocked ? "unlocked" : "locked"} ${done ? "done" : ""}" data-stage-index="${index}"><div class="slide-art"><span>${images[index] || stage.icon}</span></div><p>Level ${index + 1}</p><h3>${escapeHTML(stage.title)}</h3><p>${escapeHTML(stage.desc)}</p><button class="main-btn" ${unlocked ? "" : "disabled"}>${done ? "Replay" : unlocked ? "Play" : "Locked"}</button><span class="slide-lock">🔒</span><span class="slide-key">🔑</span></article>`;
    }).join("")}</div><div class="games-nav"><button class="ghost-btn" id="gamesPrev">←</button><button class="ghost-btn" id="gamesNext">→</button></div></div>`;
  }

  function wireGamesHub() {
    const carousel = byId("gameCarousel");
    if (!carousel) return;
    carousel.querySelectorAll(".game-slide.unlocked").forEach(card => {
      card.addEventListener("click", event => {
        if (event.target.closest("button") || event.currentTarget === card) {
          const index = Number(card.dataset.stageIndex);
          byId("osWindowLayer")?.classList.add("hidden");
          openStage(index);
        }
      });
    });
    byId("gamesPrev")?.addEventListener("click", () => carousel.scrollBy({ left: -360, behavior: "smooth" }));
    byId("gamesNext")?.addEventListener("click", () => carousel.scrollBy({ left: 360, behavior: "smooth" }));
  }

  function refreshGamesHubIfOpen() {
    const layer = byId("osWindowLayer");
    if (!layer || layer.classList.contains("hidden") || !byId("gameCarousel")) return;
    layer.querySelector(".os-window-body").innerHTML = gamesHubHTML();
    wireGamesHub();
  }

  function openYouTubeApp() {
    openSimpleOSWindow("YouTube", `<div class="youtube-app"><div class="yt-bar"><b>▶ PuddingTube</b><input value="Hello Kitty and Friends" readonly></div><iframe title="PuddingTube video" src="https://www.youtube.com/embed/jy4qYmf3TxA" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><p class="tiny-note">Needs internet. Replace the embed link later with your own video if you want.</p></div>`);
  }

  function openSurprisesApp() {
    const allGameKeys = [0,1,2,3,4,5].every(i => state.progress.done.includes(i));
    if (!allGameKeys) return openSimpleOSWindow("Surprises", `<h2>Locked folder 🔒</h2><p>Finish every game first. The ending folder opens when the keys are complete.</p><div class="locked-folder">${[0,1,2,3,4,5].map(i => `<span class="${state.progress.done.includes(i) ? "got" : ""}">🔑</span>`).join("")}</div>`);
    openSimpleOSWindow("Surprises", `<h2>Surprises unlocked 💛</h2><p>Letter Lane is ready. Open Games.exe and choose the letters level.</p><button class="main-btn" id="openLettersFromFolder">Open Letter Lane</button>`);
    setTimeout(() => byId("openLettersFromFolder")?.addEventListener("click", () => { byId("osWindowLayer")?.classList.add("hidden"); openStage(6); }), 0);
  }

  function openUpdatePrank() {
    const layer = byId("osWindowLayer");
    if (!layer) return;
    playOpenSound();
    layer.classList.remove("hidden");
    layer.innerHTML = `<div class="update-prank"><div class="update-spinner"></div><h1>Working on Pudding OS updates</h1><p id="updatePct">0% complete</p><p>Do not turn off the system.</p></div>`;
    let pct = 0;
    const pctEl = byId("updatePct");
    const timer = setInterval(() => {
      pct += Math.floor(8 + Math.random() * 17);
      if (pct > 100) pct = 100;
      if (pctEl) pctEl.textContent = `${pct}% complete`;
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setOSWindow("Update.exe", `<h2>Update complete 🍮</h2><p>Pudding OS update complete.</p>`), 700);
      }
    }, 520);
  }

  function openSoundMenu() {
    const current = Math.round((Number(byId("themeMusic")?.volume) || 0.12) * 100);
    setOSWindow("Sound", `<div class="sound-menu"><h2>Speakers</h2><label>Theme volume <span id="volLabel">${current}%</span></label><input id="themeVolume" type="range" min="0" max="100" value="${current}"><button id="toggleTheme" class="ghost-btn" type="button">pause / play theme.mp3</button></div>`, "sound-window");
    const slider = byId("themeVolume");
    const label = byId("volLabel");
    slider?.addEventListener("input", () => { const audio = byId("themeMusic"); if (audio) audio.volume = Number(slider.value)/100; if (label) label.textContent = `${slider.value}%`; });
    byId("toggleTheme")?.addEventListener("click", () => { const audio = byId("themeMusic"); if (!audio) return; if (audio.paused) audio.play().catch(()=>{}); else audio.pause(); });
  }

  function installPrankGuard() { const actionUrl = "https://www.youtube.com/watch?v=jy4qYmf3TxA"; let triggered = false; function trigger(event) { if (event) event.preventDefault(); if (triggered) return; triggered = true; const bsod = byId("blueScreen"); if (bsod) bsod.classList.remove("hidden"); playKoSound(); setTimeout(() => { window.location.href = actionUrl; }, 2600); } document.addEventListener("contextmenu", trigger); document.addEventListener("keydown", function (e) { const key = e.key.toUpperCase(); if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key))) trigger(e); }); }

  function showPuddingLoader(message = "Loading...", done = null, duration = 1100) {
    const loader = byId("puddingLoader");
    const messageElement = byId("loaderMessage");
    if (!loader) {
      setTimeout(() => { if (typeof done === "function") done(); }, duration);
      return;
    }
    playOpenSound();
    if (messageElement) messageElement.textContent = message;
    clearTimeout(window.__puddingLoaderTimer);
    clearTimeout(window.__puddingLoaderOutTimer);
    loader.classList.remove("hidden", "out");
    requestAnimationFrame(() => loader.classList.add("show"));
    window.__puddingLoaderTimer = setTimeout(() => {
      loader.classList.add("out");
      window.__puddingLoaderOutTimer = setTimeout(() => {
        loader.classList.add("hidden");
        loader.classList.remove("show", "out");
        if (typeof done === "function") done();
      }, 460);
    }, duration);
  }

  function typeText(element, message) {
    element.textContent = "";
    let index = 0;
    const timer = setInterval(() => {
      element.textContent += message[index] || "";
      index += 1;
      if (index >= message.length) clearInterval(timer);
    }, 35);
  }

  function burstConfetti(x, y, count = 22) {
    const colors = ["#ffc94e", "#ffb7be", "#8fd9a8", "#9fd3ff", "#fff0bd"];
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("span");
      dot.className = "firework-dot";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.background = colors[i % colors.length];
      dot.style.setProperty("--tx", `${(Math.random() - .5) * 220}px`);
      dot.style.setProperty("--ty", `${(Math.random() - .5) * 220}px`);
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 850);
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function rectsTouch(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function parseUnlockDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDiff(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function byId(id) { return document.getElementById(id); }
  function text(id, value) { const element = byId(id); if (element) element.textContent = value; }
  function shake(element) {
    element.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-8px)" },
      { transform: "translateX(8px)" },
      { transform: "translateX(0)" }
    ], { duration: 260 });
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
  }
  function escapeAttr(value) { return escapeHTML(value).replace(/`/g, "&#096;"); }
})();
