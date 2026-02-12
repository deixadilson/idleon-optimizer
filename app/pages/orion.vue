<script setup lang="ts">
const { state, featherGen, target, timeToTarget, upgradeAnalysis, bestUpgradeIndex } = useOrion();
const { formatNumber, formatTime, parseNumber } = useFormatters();

const featherInput = ref("");
const isHelpOpen = ref(false);

onMounted(() => {
  featherInput.value = formatNumber(state.currentFeathers);
});

watch(() => state.currentFeathers, (v) => {
  if (parseNumber(featherInput.value) !== v) {
    featherInput.value = formatNumber(v);
  }
});

const handleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  featherInput.value = val;
  const parsed = parseNumber(val);
  if (!isNaN(parsed)) state.currentFeathers = Math.max(0, parsed);
};

const handleBlur = () => {
  state.currentFeathers = parseNumber(featherInput.value);
  featherInput.value = formatNumber(state.currentFeathers);
};

const buyBest = () => {
  const idx = bestUpgradeIndex.value;
  if (idx !== -1 && upgradeAnalysis.value[idx] && state.levels[idx]) {
    state.currentFeathers = Math.max(0, state.currentFeathers - upgradeAnalysis.value[idx].cost);
    state.levels[idx]++;
  }
};
</script>

<template>
  <div class="orion-page">
    <div class="main-width-wrapper">
      <div class="page-title-row">
        <h1 class="page-title">ORION THE GREAT HORNED OWL'S FEATHER ENTERPRISE</h1>
        <button class="help-btn" @click="isHelpOpen = true">ℹ</button>
      </div>

      <header class="dashboard">
        <div class="card"><label>FeatherGeneration Rate</label><div class="val">{{ formatNumber(featherGen) }}/s</div></div>
        <div class="card highlight"><label>Current Target: {{ target.name }}</label><div class="val">{{ formatNumber(target.cost) }}</div></div>
        <div class="card"><label>Time to Target</label><div class="val">{{ formatTime(timeToTarget) }}</div></div>
      </header>

      <div class="settings-bar">
        <div class="input-group">
          <label>Current Feathers:</label>
          <input type="text" v-model="featherInput" @input="handleInput" @blur="handleBlur" class="styled-input" style="width: 150px;" />
        </div>
        <div class="input-group">
          <label>Shiny Feathers:</label>
          <input type="number" v-model.number="state.shinyCount" class="styled-input" style="width: 100px;" />
        </div>
        <div class="input-group">
          <label>Go Go Secret Owl (%):</label>
          <input type="number" v-model.number="state.goGoOwl" class="styled-input" style="width: 100px;" />
        </div>
        <div class="input-group">
          <label>Gambit Bonus (x):</label>
          <input type="number" step="0.01" v-model.number="state.gambitBonus" class="styled-input" style="width: 100px;" />
        </div>
        <button @click="buyBest" class="btn-auto" :class="{ 'btn-wait': bestUpgradeIndex === -1 || !upgradeAnalysis[bestUpgradeIndex] }">
          {{ bestUpgradeIndex !== -1 && upgradeAnalysis[bestUpgradeIndex] ? 'BUY: ' + upgradeAnalysis[bestUpgradeIndex]!.name.toUpperCase() : 'WAIT FOR RESET' }}
        </button>
      </div>

      <main class="upgrade-list">
        <div v-for="(upg, i) in upgradeAnalysis" :key="i" class="upgrade-card" :class="{ 'best': i === bestUpgradeIndex, 'target-row': i === target.index }">
          <div class="upg-icon-container">
            <img :src="upg.icon" class="upg-icon" />
          </div>
          <div class="upg-info">
            <div class="upg-name-row">
              <span class="upg-name">{{ upg.name.toUpperCase() }}</span>
              <span class="upg-cost">Cost: {{ formatNumber(upg.cost) }}</span>
            </div>
            <p class="upg-desc">{{ upg.description }}</p>
          </div>
          <div class="upg-input-container">
            <input type="number" v-model.number="state.levels[i]" />
          </div>
          <div class="upg-diff">
            <span v-if="i === 4 || i === 8" class="target-label">TARGET</span>
            <template v-else>
              <span v-if="upg.timeSaved > 0" class="pos">-{{ formatTime(upg.timeSaved) }}</span>
              <span v-else-if="upg.timeSaved < 0" class="neg">+{{ formatTime(Math.abs(upg.timeSaved)) }}</span>
              <span v-else>--</span>
            </template>
          </div>
        </div>
      </main>

      <section class="mf-section">
        <h3>Megafeather Bonuses</h3>
        <div class="mf-grid">
          <div v-for="n in 10" :key="n" class="mf-slot" :style="{ opacity: state.levels[8] >= n ? 1 : 0.2 }">
            <img :src="`/orion/mf-${n}.png`" class="mf-icon" />
            <div v-if="n === 10 && state.levels[8] > 10" class="mf-badge">+{{ state.levels[8] - 10 }}</div>
          </div>
        </div>
      </section>

      <div v-if="isHelpOpen" class="modal-overlay" @click.self="isHelpOpen = false">
        <div class="help-modal-box">
          <h2>How to use Orion's Optimizer</h2>
          <div class="help-modal-body">
            <ol>
              <li><strong>Import Data:</strong> Fill the fields yourself or import game data by clicking the <strong>IMPORT JSON</strong> button at the top and paste your raw JSON from Idleon Efficiency or Toolbox.</li>
              <li><strong>Efficiency:</strong> The optimizer calculates the best path to your next major reset. The most efficient standard upgrade is highlighted in <strong>Green</strong>.</li>
              <li><strong>Auto Buy:</strong> After purchasing the recommended upgrade in-game, click the <strong>"BUY: [UPGRADE]"</strong> green button to automatically update your numbers for the next recommendation.</li>
              <li><strong>Targets:</strong> The blue outline and <strong>TARGET</strong> label indicates your next major goal: either a <strong>Feather Restart</strong> or a <strong>Mega Reset</strong>. The efficiency calculation takes into account how much time each upgrade saves on the way to these targets.</li>
              <li><strong>Advanced Bonuses:</strong> Make sure to fill your <strong>Shiny Feathers</strong> count, <strong>Go Go Secret Owl</strong> bonus from the Upgrade Vault and your Bonus from <strong>Gambit</strong> as they significantly impact generation rate calculations.</li>
            </ol>
          </div>
          <button @click="isHelpOpen = false" class="btn-close-help">GOT IT!</button>
        </div>
      </div>
    </div>
  </div>
  <div><a href='https://ko-fi.com/A0A01RVDGT' target='_blank'><img style="display: block; height:36px; margin: 0 auto 10px;" src="https://storage.ko-fi.com/cdn/kofi5.png?v=6" alt="Buy Me a Coffee at ko-fi.com" /></a></div>
</template>

<style scoped>
.orion-page { padding: 20px; display: flex; justify-content: center; }
.main-width-wrapper { width: 1120px; }
.page-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-top: 10px;
}
.page-title {
  font-size: 1.4rem;
  font-weight: 900;
  color: #38bdf8;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
  text-align: center;
}
.help-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #38bdf8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}
.help-btn:hover {
  background: #334155;
  color: white;
}
.upgrade-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.upgrade-card { background: #1e293b; display: grid; grid-template-columns: 60px 1fr 100px 120px; align-items: center; padding: 12px 20px; border-radius: 10px; border: 1px solid #334155; }
.upgrade-card.best { border-color: #4ade80; background: #142a20; }
.target-row { border-left: 5px solid #38bdf8; }
.upg-icon { width: 40px; height: 40px; object-fit: contain; }
.upg-info { display: flex; flex-direction: column; padding: 0 15px; }
.upg-name-row { display: flex; align-items: baseline; gap: 15px; }
.upg-name { font-weight: bold; font-size: 1rem; color: #fff; }
.upg-cost { font-size: 0.8rem; color: #38bdf8; font-family: monospace; }
.upg-desc { font-size: 0.75rem; color: #94a3b8; font-style: italic; margin: 0; }
.upg-input-container input { width: 100%; background: #0f172a; color: white; border: 1px solid #334155; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; }
.upg-diff { text-align: right; font-family: monospace; font-weight: bold; }
.pos { color: #4ade80; } .neg { color: #f87171; } .target-label { color: #38bdf8; font-size: 0.7rem; }
.btn-auto { background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-wait { background: #444; cursor: not-allowed; }
.mf-grid { grid-template-columns: repeat(10, 1fr); }

.help-modal-box {
  background: #1e293b;
  padding: 30px;
  border-radius: 12px;
  max-width: 680px;
  width: 90%;
  border: 1px solid #334155;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.help-modal-body {
  overflow-y: auto;
  flex: 1;
  margin-bottom: 20px;
  padding-right: 10px;
}
.help-modal-box h2 {
  color: #38bdf8;
  margin-bottom: 20px;
}
.help-modal-box ol {
  padding-left: 20px;
  color: #cbd5e1;
}
.help-modal-box li {
  margin-bottom: 12px;
  line-height: 1.5;
}
.help-modal-box strong {
  color: #f8fafc;
}
.btn-close-help {
  margin-top: 20px;
  width: 100%;
  background: #38bdf8;
  color: #000;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
.btn-close-help:hover {
  filter: brightness(1.1);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
</style>
