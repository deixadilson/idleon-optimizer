<script setup lang="ts">
const { state, featherGen, target, timeToTarget, upgradeAnalysis, bestUpgradeIndex, getUpgradeCost } = useOrion();

useSeoMeta({
  title: 'Idleon Optimizer - Orion',
  description: 'Optimize your Feather generation with the Orion Owl clicker tool. Calculate the best upgrades to reach your next Megafeather faster.',
  ogTitle: 'Idleon Optimizer - Orion',
  ogDescription: 'Optimize your Feather generation with the Orion Owl clicker tool. Calculate the best upgrades to reach your next Megafeather faster.',
  ogImage: '/orion.png',
})
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
  if (idx !== -1 && upgradeAnalysis.value[idx] && state.levels[idx] !== undefined) {
    state.currentFeathers = Math.max(0, state.currentFeathers - upgradeAnalysis.value[idx]!.cost);
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
          <label>Vault Bonus (%):</label>
          <input type="number" v-model.number="state.goGoOwl" class="styled-input" style="width: 100px;" />
        </div>
        <div class="input-group">
          <label>Gambit Bonus (x):</label>
          <input type="number" step="0.01" v-model.number="state.gambitBonus" class="styled-input" style="width: 100px;" />
        </div>
        <div class="input-group">
          <label>Fountain Bonus (x):</label>
          <input type="number" step="0.01" v-model.number="state.fountainBonus" class="styled-input" style="width: 100px;" />
        </div>
        <button @click="buyBest" class="btn-auto" :class="{ 'btn-wait': bestUpgradeIndex === -1 || !upgradeAnalysis[bestUpgradeIndex] }">
          {{ bestUpgradeIndex !== -1 && upgradeAnalysis[bestUpgradeIndex] ? 'BUY: ' + upgradeAnalysis[bestUpgradeIndex]!.name.toUpperCase() : 'WAIT FOR RESET' }}
        </button>
      </div>

      <section class="grid-section">
        <main class="upgrade-grid">
          <div v-for="(upg, i) in upgradeAnalysis" :key="i" class="upgrade-card" :class="{ 'best': i === bestUpgradeIndex, 'target-row': i === target.index }">
            <div class="row-top">
              <div class="upg-icon-box">
                <img :src="upg.icon" />
              </div>
              <span class="upg-title">{{ upg.name.toUpperCase() }}</span>
            </div>
            <div class="row-mid">
              <div class="upg-mid-box">
                <div class="upg-desc-compact">{{ upg.description }}</div>
                <div class="time-variation">
                  <span v-if="i === 4 || i === 8" class="target-label">TARGET</span>
                  <template v-else>
                    <span v-if="upg.timeSaved > 0" class="pos">-{{ formatTime(upg.timeSaved) }}</span>
                    <span v-else-if="upg.timeSaved < 0" class="neg">+{{ formatTime(Math.abs(upg.timeSaved)) }}</span>
                    <span v-else>--</span>
                  </template>
                </div>
              </div>
            </div>
            <div class="row-bottom">
              <div class="level-box-mini">
                <span class="lv-label">Lv</span>
                <input type="number" v-model.number="state.levels[i]" min="0" />
              </div>
              <div class="cost-container-mini">
                <span>{{ formatNumber(upg.cost) }}</span>
                <img src="/orion/upg-0.png" class="feather-mini-icon" />
              </div>
            </div>
          </div>
        </main>
      </section>

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

.grid-section { width: 100%; margin-bottom: 30px; }
.upgrade-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #000; border: 2px solid #000; border-radius: 4px; overflow: hidden; }
.upgrade-card { background: #9c5b3d; border: 1px solid #334155; display: flex; flex-direction: column; padding: 10px; position: relative; gap: 1px; }
.upgrade-card.best { border-color: #10b981; background: #14532d; }
.target-row { border-left: 5px solid #38bdf8 !important; }

.row-top { display: flex; align-items: center; gap: 8px; }
.upg-icon-box { height: 43px; display: flex; align-items: center; justify-content: center; }
.upg-title { font-size: 0.95rem; font-weight: 900; color: #fff; text-shadow: 1.5px 1.5px 0 #000; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }

.row-mid { display: flex; align-items: center; justify-content: center; text-shadow: 2px 2px 2px #000; min-height: 60px; }
.upg-mid-box { background: rgba(0, 0, 0, 0.25); padding: 6px 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 0 2px; }
.upg-desc-compact { font-size: 0.7rem; color: #fff; font-style: italic; text-align: center; line-height: 1.2; white-space: pre-line; min-height: 2.4em; display: flex; align-items: center; justify-content: center; }
.time-variation { font-size: 1rem; font-weight: 900; font-family: monospace; }
.pos { color: #4ade80; } .neg { color: #f87171; } .target-label { color: #38bdf8; }

.row-bottom { display: flex; align-items: center; background: rgba(0, 0, 0, 0.4); border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); margin: 0 2px; }
.level-box-mini { width: 80px; border-right: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; padding-left: 6px; }
.lv-label { font-size: 0.7rem; font-weight: bold; margin-right: 2px; }
.level-box-mini input { width: 100%; background: transparent; border: none; font-size: 1rem; text-align: center; color: #fff; outline: none; font-weight: bold; padding: 4px 0; }

.cost-container-mini { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 1.05rem; color: #fff; text-shadow: 1.5px 1.5px 0 #000; font-weight: bold; font-family: monospace; }
.feather-mini-icon { width: 16px; height: 16px; }

.settings-bar { display: flex; gap: 15px; flex-wrap: wrap; background: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 20px; align-items: flex-end; }
.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label { font-size: 0.75rem; color: #94a3b8; font-weight: bold; }
.styled-input { background: #0f172a; color: white; border: 1px solid #334155; padding: 8px; border-radius: 6px; }

.btn-auto { background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; text-shadow: 1px 1px 0 rgba(0,0,0,0.5); }
.btn-wait { background: #444; cursor: not-allowed; }

.mf-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; }
.mf-slot { position: relative; display: flex; justify-content: center; align-items: center; }
.mf-icon { width: 50px; height: 50px; }
.mf-badge { position: absolute; bottom: -5px; right: -5px; background: #38bdf8; color: #000; font-size: 0.7rem; padding: 2px 5px; border-radius: 10px; font-weight: bold; }

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
</style>
