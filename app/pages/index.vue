<script setup lang="ts">
import { ref, watch } from 'vue';

const { state, featherGen, target, timeToTarget, upgradeAnalysis, bestUpgradeIndex } = useOrion();
const { formatNumber, parseNumber, formatTime } = useFormatters();

const featherInputDisplay = ref("0");

const handleFeatherInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  state.currentFeathers = parseNumber(val);
};

const handleFeatherBlur = () => {
  featherInputDisplay.value = formatNumber(state.currentFeathers);
};

watch(() => state.currentFeathers, (newVal) => {
  if (parseNumber(featherInputDisplay.value) !== newVal) {
    featherInputDisplay.value = formatNumber(newVal);
  }
});

const buyBest = () => {
  const idx = bestUpgradeIndex.value;
  if (idx !== -1) {
    const upg = upgradeAnalysis.value[idx];
    if (upg) {
      const cost = upg.cost;
      state.currentFeathers = Math.max(0, state.currentFeathers - cost);
      
      const levels = state.levels as number[];
      const currentLevel = levels[idx] ?? 0;
      levels[idx] = currentLevel + 1;
    }
  }
};

const buyButtonText = computed(() => {
  const idx = bestUpgradeIndex.value;
  if (idx === -1) return 'Wait for reset!';
  const upg = upgradeAnalysis.value[idx];
  return upg ? 'Buy: ' + upg.name : 'Wait for reset!';
});
</script>

<template>
  <div class="container">
    <header class="dashboard">
      <div class="card">
        <label>Total Feather Gen</label>
        <div class="val">{{ formatNumber(featherGen) }}/s</div>
      </div>
      <div class="card highlight">
        <label>Next Target: {{ target.name }}</label>
        <div class="val">{{ formatNumber(target.cost) }}</div>
      </div>
      <div class="card">
        <label>Time to Target</label>
        <div class="val">{{ formatTime(timeToTarget) }}</div>
      </div>
    </header>

    <div class="settings-bar">
      <div class="setting-item">
        <label>Current Feathers</label>
        <input type="text" v-model="featherInputDisplay" @input="handleFeatherInput" @blur="handleFeatherBlur" class="styled-input" />
      </div>
      <div class="setting-item small">
        <label>Shiny Feathers</label>
        <input type="number" v-model.number="state.shinyCount" class="styled-input" />
      </div>
      <div class="setting-item small">
        <label>Go Go Secret Owl (%)</label>
        <input type="number" v-model.number="state.goGoOwl" class="styled-input" />
      </div>
      <div class="setting-item small">
        <label>Gambit Bonus (x)</label>
        <input type="number" v-model.number="state.gambitBonus" step="0.01" class="styled-input" />
      </div>
      <button @click="buyBest" class="btn-auto" :class="{ 'btn-wait': bestUpgradeIndex === -1 }">
        {{ buyButtonText }}
      </button>
    </div>

    <main class="upgrade-list">
      <div v-for="(upg, i) in upgradeAnalysis" :key="i" class="upgrade-item"
        :class="{ 'best': i === bestUpgradeIndex, 'target-row': i === target.index, 'mega-row': i === 8 }">
        <img :src="upg.icon" class="upg-icon" />
        <div class="upg-content">
          <div class="upg-header">
            <span class="upg-name">{{ upg.name }}</span>
            <span class="upg-cost">Cost: {{ formatNumber(upg.cost) }}</span>
          </div>
          <p class="upg-description">{{ upg.description }}</p>
        </div>
        <div class="upg-input-container">
          <input type="number" v-model.number="(state.levels as number[])[i]" min="0" />
        </div>
        <div class="upg-diff">
          <template v-if="i === 4 || i === 8">
            <span class="target-label">RESET TARGET</span>
          </template>
          <template v-else>
            <span v-if="upg.timeSaved > 0" class="pos">-{{ formatTime(upg.timeSaved) }}</span>
            <span v-else-if="upg.timeSaved < 0" class="neg">+{{ formatTime(Math.abs(upg.timeSaved)) }}</span>
            <span v-else class="neutral">--</span>
          </template>
        </div>
      </div>
    </main>

    <section class="mf-section">
      <h3>Megafeather Bonuses</h3>
      <div class="mf-grid">
        <div v-for="n in 10" :key="n" class="mf-slot" :style="{ opacity: (state.levels[8] || 0) >= n ? 1 : 0.2 }">
          <img :src="`/orion/mf-${n}.png`" class="mf-icon" />
          <div v-if="n === 10 && (state.levels[8] || 0) > 10" class="mf-badge">+{{ (state.levels[8] || 0) - 10 }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
:root {
  --bg: #0b0f1a;
  --card: #161d2f;
  --input-bg: #0f172a;
  --text: #e2e8f0;
  --accent: #38bdf8;
  --green: #22c55e;
  --red: #ef4444;
  --border: #2d3748;
}

body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; padding: 20px; margin: 0; }
.container { max-width: 1050px; margin: 0 auto; }

.dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
.card { background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border); text-align: center; }
.card .val { font-size: 1.6rem; font-weight: 800; color: var(--accent); }
.highlight { border-color: var(--accent); }

.settings-bar { display: flex; gap: 12px; background: var(--card); padding: 15px; border-radius: 12px; margin-bottom: 20px; align-items: flex-end; border: 1px solid var(--border); }
.setting-item { flex: 2; display: flex; flex-direction: column; }
.setting-item.small { flex: 1; }
.setting-item label { font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px; }

.styled-input { background: var(--input-bg); color: white; border: 1px solid var(--border); padding: 10px; border-radius: 6px; font-size: 0.9rem; width: 100%; box-sizing: border-box; }

.btn-auto { background: var(--green); color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; min-width: 200px; height: 42px; }
.btn-wait { background: #334155; cursor: not-allowed; }

.upgrade-item { display: grid; grid-template-columns: 45px 1fr 90px 140px; gap: 15px; background: var(--card); padding: 12px 18px; border-radius: 10px; margin-bottom: 8px; align-items: center; border: 1px solid var(--border); }
.upgrade-item.best { border-color: var(--green); background: #142a20; }
.target-row { border-left: 6px solid var(--accent); }
.mega-row { background: #1a1a3a; }

.upg-icon { width: 40px; height: 40px; object-fit: contain; }
.upg-content { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.upg-header { display: flex; align-items: baseline; gap: 12px; }
.upg-name { font-weight: bold; font-size: 1rem; }
.upg-description { margin: 0; font-size: 0.75rem; color: #94a3b8; font-style: italic; }
.upg-cost { font-size: 0.8rem; color: #38bdf8; font-family: monospace; }

.upg-input-container input { width: 100%; background: var(--input-bg); color: white; border: 1px solid var(--border); padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; }

.upg-diff { text-align: right; font-family: 'Courier New', monospace; font-size: 0.95rem; font-weight: bold; }
.pos { color: var(--green); }
.neg { color: var(--red); }
.neutral { color: #94a3b8; }
.target-label { color: var(--accent) !important; font-size: 0.7rem; font-weight: bold; }

.mf-section { margin-top: 30px; background: var(--card); padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
.mf-section h3 { margin-top: 0; }
.mf-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; margin-top: 15px; }
.mf-slot { position: relative; display: flex; justify-content: center; }
.mf-icon { width: 100%; max-width: 50px; height: auto; }
.mf-badge { position: absolute; bottom: -5px; right: -5px; background: var(--accent); color: #000; font-size: 0.75rem; font-weight: 900; padding: 2px 6px; border-radius: 10px; border: 2px solid white; }
</style>