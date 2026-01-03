<script setup lang="ts">
const { state, featherGen, target, timeToTarget, upgradeAnalysis, bestUpgradeIndex } = useOrion();
const { formatNumber, formatTime, parseNumber } = useFormatters();

const featherInput = ref("");

onMounted(() => {
  featherInput.value = formatNumber(state.currentFeathers);
});

watch(() => state.currentFeathers, (newVal) => {
  featherInput.value = formatNumber(newVal);
});

const handleBlur = () => {
  state.currentFeathers = parseNumber(featherInput.value);
  featherInput.value = formatNumber(state.currentFeathers);
};

const buyBest = () => {
  const idx = bestUpgradeIndex.value;
  if (idx !== -1) {
    state.currentFeathers = Math.max(0, state.currentFeathers - upgradeAnalysis.value[idx].cost);
    state.levels[idx]++;
  }
};
</script>

<template>
  <div class="orion-page">
    <div class="main-width-wrapper">
      <header class="dashboard">
        <div class="card"><label>Generation Rate</label><div class="val">{{ formatNumber(featherGen) }}/s</div></div>
        <div class="card highlight"><label>Current Target: {{ target.name }}</label><div class="val">{{ formatNumber(target.cost) }}</div></div>
        <div class="card"><label>Time to Target</label><div class="val">{{ formatTime(timeToTarget) }}</div></div>
      </header>

      <div class="settings-bar">
        <div class="input-group">
          <label>Current Feathers:</label>
          <input type="text" v-model="featherInput" @blur="handleBlur" class="styled-input" style="width: 150px;" />
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
        <button @click="buyBest" class="btn-auto" :class="{ 'btn-wait': bestUpgradeIndex === -1 }">
          {{ bestUpgradeIndex !== -1 ? 'BUY: ' + upgradeAnalysis[bestUpgradeIndex].name.toUpperCase() : 'WAIT FOR RESET' }}
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
    </div>
  </div>
</template>

<style scoped>
.orion-page { padding: 20px; display: flex; justify-content: center; }
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
</style>