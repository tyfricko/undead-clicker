
let gameState = {
  blood: 0,
  essence: 0,
  clickPower: 1,
  passiveIncome: 0,
  upgrades: [
    { id: 1, name: 'Sharpened Fangs', cost: 10, powerIncrease: 1, purchased: false },
    { id: 2, name: 'Undead Strength', cost: 50, powerIncrease: 5, purchased: false },
    { id: 3, name: 'Vampiric Might', cost: 100, powerIncrease: 10, purchased: false },
    { id: 4, name: 'Blood Frenzy', cost: 1000, powerIncrease: 0, unlocksCombo: true, purchased: false }
  ],
  minions: [
    { id: 1, name: 'Zombie Minion', cost: 25, income: 0.1, owned: 0 },
    { id: 2, name: 'Skeleton Worker', cost: 100, income: 0.5, owned: 0 },
    { id: 3, name: 'Vampire Thrall', cost: 500, income: 2, owned: 0 }
  ]
};

let comboCount = 0;
let lastClickTime = 0;
let comboMultiplier = 1;
let comboActive = false;
let comboUnlocked = false;

const el = id => document.getElementById(id);

function getMultiplier(count) {
  if (count >= 20) return 3.0;
  if (count >= 10) return 2.0;
  if (count >= 5) return 1.5;
  return 1.0;
}

function updateCombo() {

  if (!comboUnlocked) {
    el("comboBar").style.width = "0%";
    el("comboDisplay").textContent = "";
    return;
  }

  const now = Date.now();
  const timeSinceClick = now - lastClickTime;
  if (timeSinceClick > 2000 && comboActive) {
    comboCount = 0;
    comboMultiplier = 1;
    comboActive = false;
    el("comboBar").style.width = "0%";
    el("comboBar").style.backgroundColor = "#9ca3af"; // gray-400
    el("comboDisplay").textContent = "";
    return;
  }

  comboMultiplier = getMultiplier(comboCount);
  if (comboMultiplier > 1) comboActive = true;

  el("comboDisplay").textContent = comboMultiplier > 1
    ? `Combo x${comboMultiplier.toFixed(1)}!` : "";

  const percent = Math.min(comboCount / 20, 1) * 100;
  const bar = el("comboBar");
  bar.style.width = `${percent}%`;
  bar.style.backgroundColor =
    comboMultiplier === 3.0 ? "#dc2626" :
      comboMultiplier === 2.0 ? "#f97316" :
        comboMultiplier === 1.5 ? "#facc15" :
          "#9ca3af";

  // When in multilier mode add FX to the button
  const skull = document.getElementById("skullButton");

  if (comboMultiplier > 1) {
    skull.classList.add("combo-active");
  } else {
    skull.classList.remove("combo-active");
  }

}

function showEffect(x, y, text) {

  const el = document.createElement('div');
  el.textContent = text;
  el.className = 'absolute text-red-400 font-bold pointer-events-none animate-float';

  const size = 16 + Math.random() * 16;
  const offsetX = (Math.random() - 0.5) * 30;
  const rotate = (Math.random() - 0.5) * 20;

  el.style.left = `${x + offsetX}px`;
  el.style.top = `${y - 30}px`;
  el.style.fontSize = `${size}px`;
  el.style.transform = `rotate(${rotate}deg)`;
  el.style.zIndex = 100;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}


function updateUI() {
  el('blood').textContent = Math.floor(gameState.blood);
  el('essence').textContent = gameState.essence;
  el('clickPower').textContent = gameState.clickPower;
  el('passiveIncome').textContent = gameState.passiveIncome.toFixed(1);
  updateCombo();

  const minionDiv = el('minions');
  minionDiv.innerHTML = '';
  gameState.minions.forEach(minion => {
    const disabled = gameState.blood < minion.cost ? 'opacity-50 cursor-not-allowed' : '';
    minionDiv.innerHTML += `
          <div class="flex justify-between bg-gray-700 p-2 rounded">
            <div>
              <p class="font-medium">${minion.name}</p>
              <p class="text-sm text-gray-300">${minion.owned} owned (${minion.income}/s)</p>
            </div>
            <button class="bg-blue-600 px-3 py-1 rounded ${disabled}" onclick="purchaseMinion(${minion.id})" ${gameState.blood < minion.cost ? 'disabled' : ''}>
              Buy (${minion.cost})
            </button>
          </div>`;
  });

  const upgradeDiv = el('upgrades');
  upgradeDiv.innerHTML = '';
  gameState.upgrades.forEach(upg => {
    const isBought = upg.purchased;
    upgradeDiv.innerHTML += `
          <div class="flex justify-between bg-gray-700 p-2 rounded">
            <div>
              <p class="font-medium">${upg.name}</p>
              <p class="text-sm text-gray-300">+${upg.powerIncrease} power</p>
            </div>
            ${isBought
        ? `<span class="text-green-400 font-bold self-center">✓</span>`
        : `<button class="bg-green-600 px-3 py-1 rounded ${gameState.blood < upg.cost ? 'opacity-50 cursor-not-allowed' : ''}" onclick="purchaseUpgrade(${upg.id})" ${gameState.blood < upg.cost ? 'disabled' : ''}>
                  Buy (${upg.cost})
                </button>`
      }
          </div>`;
  });

}

function handleClick(e) {
  const now = Date.now();

  if (comboUnlocked) {
    if (now - lastClickTime < 1000) comboCount++;
    else comboCount = 1;

    lastClickTime = now;
    comboMultiplier = getMultiplier(comboCount);

  } else {
    comboMultiplier = 1;
  }

  const bloodEarned = gameState.clickPower * comboMultiplier;
  gameState.blood += bloodEarned;

  showEffect(e.clientX, e.clientY, `+${Math.floor(bloodEarned)}`);

  updateUI();
}

function purchaseUpgrade(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || upg.purchased || gameState.blood < upg.cost) return;
  gameState.blood -= upg.cost;
  upg.purchased = true;
  gameState.clickPower += upg.powerIncrease;

  if (upg.unlocksCombo) comboUnlocked = true;

  updateUI();
}

function purchaseMinion(id) {
  const minion = gameState.minions.find(m => m.id === id);
  if (!minion || gameState.blood < minion.cost) return;
  gameState.blood -= minion.cost;
  minion.owned++;
  gameState.passiveIncome += minion.income;
  minion.cost = Math.floor(minion.cost * 1.15);
  updateUI();
}

function saveGame() {
  try {
    const saveData = {
      gameState,
      essenceUpgrades
    };
    localStorage.setItem('undeadClickerSave', JSON.stringify(saveData));
  } catch (e) {
    console.error("Failed to save game:", e);
    alert("⚠️ Could not save your progress!");
  }
}

// Save every 10s
setInterval(() => {
  saveGame();
}, 10000); 

window.addEventListener("beforeunload", saveGame);

function loadGame() {
  try {
    const saved = localStorage.getItem('undeadClickerSave');
    if (!saved) return;

    const data = JSON.parse(saved);
    if (data.gameState) gameState = data.gameState;
    if (data.essenceUpgrades) essenceUpgrades = data.essenceUpgrades;

    updateUI();
  } catch (e) {
    console.error("Failed to load game:", e);
    alert("⚠️ Failed to load save data. Save may be corrupted.");
  }
}


function resetGame() {
  if (!confirm('Reset all progress?')) return;
  localStorage.removeItem('undeadClickerSave');
  location.reload();
}

setInterval(() => {
  if (gameState.passiveIncome > 0) {
    gameState.blood += gameState.passiveIncome;
    updateUI();
  }
}, 1000);

setInterval(() => updateCombo(), 250);

updateUI();

loadGame(); 

// BOSS LOGIC

let boss = {
  hp: 1000,
  maxHp: 1000,
  time: 30,
  active: false,
  interval: null,
  timeout: null
};

function startBossFight() {
  if (boss.active) return;

  boss.active = true;
  boss.hp = boss.maxHp;
  boss.time = 30;

  el("bossModal").classList.remove("hidden");
  el("bossTimer").textContent = boss.time;
  updateBossBar();

  boss.interval = setInterval(() => {
    boss.time--;
    el("bossTimer").textContent = boss.time;
    boss.hp -= gameState.passiveIncome;
    updateBossBar();

    if (boss.hp <= 0) endBossFight(true);
    else if (boss.time <= 0) endBossFight(false);
  }, 1000);
}

function updateBossBar() {
  const percent = Math.max(0, (boss.hp / boss.maxHp) * 100);
  el("bossHealthBar").style.width = `${percent}%`;
}

function attackBoss() {
  if (!boss.active) return;
  boss.hp -= gameState.clickPower;
  updateBossBar();
  if (boss.hp <= 0) endBossFight(true);
}

function endBossFight(victory) {
  clearInterval(boss.interval);
  boss.active = false;
  el("bossModal").classList.add("hidden");

  if (victory) {
    const bloodReward = 500 + Math.floor(Math.random() * 500);
    const essenceReward = Math.floor(1 + Math.random() * 3);

    gameState.blood += bloodReward;
    gameState.essence += essenceReward;

    alert(`Victory! You gained ${bloodReward} blood and ${essenceReward} Dark Essence.`);
  } else {
    alert("The Blood Wraith escaped...");
  }

  updateUI();
  
}

//Dark Essence Logic

let essenceUpgrades = [
  { id: 1, name: 'Soul Infusion', desc: '+10% click power', cost: 5, purchased: false },
  { id: 2, name: 'Ritual Overflow', desc: '+10% passive income', cost: 8, purchased: false },
  { id: 3, name: 'Vampiric Preservation', desc: 'Keep 10% blood on reset (future)', cost: 12, purchased: false }
];

function openEssenceShop() {
  const list = document.getElementById('essenceUpgrades');
  list.innerHTML = '';

  essenceUpgrades.forEach(upg => {
    const owned = upg.purchased ? '<span class="text-green-400">✓</span>' : 
      `<button class="bg-indigo-600 px-3 py-1 rounded text-sm" onclick="buyEssenceUpgrade(${upg.id})" ${gameState.essence < upg.cost ? 'disabled class="opacity-50"' : ''}>Buy ✦${upg.cost}</button>`;

    list.innerHTML += `
      <div class="bg-gray-700 p-3 rounded text-left">
        <p class="font-bold text-white">${upg.name}</p>
        <p class="text-sm text-gray-300">${upg.desc}</p>
        <div class="mt-2 text-right">${owned}</div>
      </div>
    `;
  });

  document.getElementById('essenceShop').classList.remove('hidden');
}

function closeEssenceShop() {
  document.getElementById('essenceShop').classList.add('hidden');
}

function buyEssenceUpgrade(id) {
  const upg = essenceUpgrades.find(u => u.id === id);
  if (!upg || upg.purchased || gameState.essence < upg.cost) return;

  gameState.essence -= upg.cost;
  upg.purchased = true;

  // Apply effects
  if (upg.id === 1) gameState.clickPower *= 1.10;
  if (upg.id === 2) gameState.passiveIncome *= 1.10;

  updateUI();
  openEssenceShop(); // Refresh display
}


