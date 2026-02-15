<script setup lang="ts">
const { 
  state, pondGen, tarGen, pondUpgradeAnalysis, tarUpgradeAnalysis, 
  POND_UPGRADE_NAMES, TAR_UPGRADE_NAMES, target, timeToTarget, fisherooBonuses, totalShinyMult,
  pointsToGain
} = usePoppy();
const { formatNumber, parseNumber, formatTime, formatMultiplier, formatTartarGen } = useFormatters();

const fishInputDisplay = ref("");

onMounted(() => {
  fishInputDisplay.value = formatNumber(state.currentFish);
});

watch(() => state.currentFish, (v) => {
  if (parseNumber(fishInputDisplay.value) !== v) {
    fishInputDisplay.value = formatNumber(v);
  }
});

const handleFishInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  fishInputDisplay.value = val;
  const parsed = parseNumber(val);
  if (!isNaN(parsed)) state.currentFish = Math.max(0, parsed);
};

const handleFishBlur = () => { 
  fishInputDisplay.value = formatNumber(state.currentFish); 
};

const bestPondIndex = computed(() => {
  let bestIdx = -1, maxEff = 0;
  pondUpgradeAnalysis.value.forEach((upg, i) => {
    if (i !== 6 && i !== 11 && upg.efficiency > maxEff) {
      maxEff = upg.efficiency;
      bestIdx = i;
    }
  });
  return bestIdx;
});

const bestTarIndex = computed(() => {
  let bestIdx = -1, maxEff = 0;
  tarUpgradeAnalysis.value.forEach((upg, i) => {
    if (upg.efficiency > maxEff) {
      maxEff = upg.efficiency;
      bestIdx = i;
    }
  });
  return bestIdx;
});

const buyBestPond = () => {
  const idx = bestPondIndex.value;
  const upg = pondUpgradeAnalysis.value[idx];
  if (idx !== -1 && upg && state.pondLevels[idx] !== undefined) {
    state.pondLevels[idx]++;
  }
};

const buyBestTar = () => {
  const idx = bestTarIndex.value;
  const upg = tarUpgradeAnalysis.value[idx];
  if (idx !== -1 && upg && state.tarLevels[idx] !== undefined) {
    state.tarLevels[idx]++;
  }
};

const isHelpOpen = ref(false);
const fisherooColors = ["#38bdf8", "#fbbf24", "#22c55e", "#f87171", "#aaaaaa"];
</script>

<template>
  <div class="poppy-page">
    <div class="main-width-wrapper">
      <div class="page-title-row">
        <h1 class="page-title">POPPY THE KANGAROO MOUSE'S FISH POND</h1>
        <button class="help-btn" @click="isHelpOpen = true">ℹ</button>
      </div>

      <header class="dashboard">
        <div class="card"><label>Bluefin Generation Rate</label><div class="val">{{ formatNumber(pondGen) }}/min</div></div>
        <div class="card highlight"><label>Current Target: {{ target.name }}</label><div class="val">{{ formatNumber(target.cost) }}</div></div>
        <div class="card"><label>Time to Target</label><div class="val">{{ formatTime(timeToTarget) }}</div></div>
      </header>

      <section class="buy-section pf-buy">
        <div class="settings-bar-inner">
            <div class="input-group"><label>Current Bluefin:</label><input type="text" v-model="fishInputDisplay" @input="handleFishInput" @blur="handleFishBlur" class="styled-input" style="width: 140px;" /></div>
            <div class="input-group"><label>Go Go Secret Kangaroo Mouse (%):</label><input type="number" v-model.number="state.goGoSecretKangaroo" class="styled-input" style="width: 90px;" /></div>
            <div class="input-group"><label>Gambit Bonus (x):</label><input type="number" step="0.01" v-model.number="state.gambitBonus" class="styled-input" style="width: 80px;" /></div>
            <div class="input-group">
                <label>Target:</label>
                <select v-model="state.targetMode" class="styled-input styled-select" style="width: 160px;">
                    <option value="CHEAPEST">CHEAPEST TARGET</option>
                    <option value="RESET">FISHEROO RESET</option>
                    <option value="CATCH">GREATEST CATCH</option>
                </select>
            </div>
            <button @click="buyBestPond" class="btn-auto" :disabled="bestPondIndex === -1">
              BUY POND: {{ bestPondIndex !== -1 ? (POND_UPGRADE_NAMES[bestPondIndex] ?? '').toUpperCase() : 'WAIT' }}
            </button>
        </div>
      </section>
      <div class="best-upg-hidden">{{ (POND_UPGRADE_NAMES[bestPondIndex] ?? '').toUpperCase() }}</div>
      <section class="grid-section">
        <main class="upgrade-grid">
          <div v-for="(upg, i) in pondUpgradeAnalysis" :key="i" class="upgrade-card" :class="{ 'best': i === bestPondIndex, 'target-row': i === target.index }">
            <div class="row-top">
              <div class="upg-icon-box">
                <img :src="upg.icon" />
              </div>
              <span class="upg-title">{{ (upg.name ?? '').toUpperCase() }}</span>
            </div>
            <div class="row-mid-refactor">
              <div class="upg-mid-box">
                <div class="upg-desc-compact">{{ upg.description }}</div>
                <div class="time-variation">
                  <span v-if="i === 6 || i === 11" class="target-label">TARGET</span>
                  <template v-else>
                      <span v-if="(upg.timeSaved ?? 0) > 0" class="pos">-{{ formatTime(upg.timeSaved ?? 0) }}</span>
                      <span v-else-if="(upg.timeSaved ?? 0) < 0" class="neg">+{{ formatTime(Math.abs(upg.timeSaved ?? 0)) }}</span>
                      <span v-else>--</span>
                  </template>
                </div>
              </div>
            </div>
            <div class="row-bottom-refactor">
              <div class="level-box-mini">
                <span class="lv-label">Lv</span>
                <input type="number" v-model.number="state.pondLevels[i]" min="0" />
              </div>
              <div class="cost-container-mini">
                <span>{{ formatNumber(upg.cost) }}</span>
                <img src="/poppy/bluefin-icon.png" class="fish-mini-icon" />
              </div>
            </div>
          </div>
        </main>
      </section>

      <section class="buy-section tf-buy">
        <div class="settings-bar-inner justify-end">
            <div class="input-group" style="margin-right: auto;"><label>Tartar Fish Generation Rate:</label><div class="val-display">{{ formatTartarGen(tarGen) }}/hr</div></div>
            <button @click="buyBestTar" class="btn-auto tar-btn green-btn" :disabled="bestTarIndex === -1">
              BUY TAR: {{ bestTarIndex !== -1 ? (TAR_UPGRADE_NAMES[bestTarIndex] ?? '').toUpperCase() : 'WAIT' }}
            </button>
        </div>
      </section>
      <div class="best-upg-hidden">{{ (TAR_UPGRADE_NAMES[bestTarIndex] ?? '').toUpperCase() }}</div>
      <section class="grid-section shadow-grid">
        <main class="upgrade-grid tar-grid">
          <div v-for="(upg, i) in tarUpgradeAnalysis" :key="i" class="upgrade-card" :class="{ 'best': i === bestTarIndex }">
            <div class="row-top">
              <div class="upg-icon-box">
                <img :src="upg.icon" />
              </div>
              <span class="upg-title">{{ (upg.name ?? '').toUpperCase() }}</span>
            </div>
            <div class="row-mid-refactor">
              <div class="upg-mid-box">
                <div class="upg-desc-compact">{{ upg.description }}</div>
                <div class="time-variation">
                  <span v-if="upg.timeSaved > 0" class="pos">-{{ formatTime(upg.timeSaved) }}</span>
                  <span v-else>--</span>
                </div>
              </div>
            </div>
            <div class="row-bottom-refactor">
              <div class="level-box-mini">
                <span class="lv-label">Lv</span>
                <input type="number" v-model.number="state.tarLevels[i]" min="0" />
              </div>
              <div class="cost-container-mini">
                <span>{{ formatNumber(upg.cost) }}</span>
                <img src="/poppy/tartar-icon.png" class="fish-mini-icon" />
              </div>
            </div>
          </div>
        </main>
      </section>

      <section class="mf-section pf-buy">
        <h3>Fisheroo</h3>
        <div class="settings-bar-inner">
            <div class="input-group"><label>Fisheroo Pts:</label><input type="number" v-model.number="state.totalFisherooPoints" class="styled-input" style="width: 100px;" /></div>
            <div class="input-group"><label>Pts on Next Reset:</label><div class="val-display">+{{ pointsToGain }}</div></div>
            <div class="input-group">
              <label>Auto Distribute:</label>
              <select v-model="state.distributionMode" class="styled-input styled-select" style="width: 220px;">
                <option value="Custom">Custom</option>
                <option value="Max bluefin gen">Max bluefin generation</option>
                <option value="max shiny fish and luck">Max shiny fish and luck</option>
                <option value="max cost reduction">Max cost reduction</option>
                <option value="max tartar gen">Max tartar generation</option>
                <option value="bluefin and tartar">Bluefin and tartar</option>
                <option value="balanced gen">All generation</option>
              </select>
            </div>
        </div>
        <div class="spiral-grid">
          <div v-for="(bonus, i) in fisherooBonuses" :key="i" class="spiral-card" :style="{ borderColor: fisherooColors[i] }">
            <div class="spiral-left">
              <div class="spiral-icon-box" :style="{ background: fisherooColors[i] + '20' }">
                <img :src="`/poppy/spiral-${i+1}.png`" class="spiral-icon" />
              </div>
              <div class="level-input-simple">
                <input type="number" v-model.number="state.fisherooLevels[i]" min="0" />
              </div>
            </div>
            <div class="spiral-right">
              <div class="spiral-desc" :style="{ color: fisherooColors[i] }">{{ bonus.text }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="mf-section shiny-section">
        <h3>SHINY FISH</h3>
        <div class="shiny-grid">
          <div v-for="n in 6" :key="n" class="shiny-slot">
            <div class="shiny-icon-box">
              <img :src="`/poppy/shiny-${n}.png`" class="shiny-icon" />
            </div>
            <div class="shiny-input-row">
              <input type="number" v-model.number="state.shinyMultipliers[n-1]" min="1" step="0.01" />
              <span>x</span>
            </div>
          </div>
        </div>
        <div class="total-mult-footer">Total Multi: {{ formatMultiplier(totalShinyMult) }}x</div>
      </section>

      <section class="mf-section">
        <h3>MEGAFISH TIER BONUSES</h3>
        <div class="mf-grid">
          <div v-for="n in 12" :key="n" class="mf-slot" :style="{ opacity: (state.pondLevels[11] ?? 0) >= n ? 1 : 0.2 }">
            <img :src="`/poppy/mf-${n}.png`" class="mf-icon" />
            <div v-if="n === 12 && (state.pondLevels[11] ?? 0) > 12" class="mf-badge">+{{ (state.pondLevels[11] ?? 0) - 12 }}</div>
          </div>
        </div>
      </section>
      <div><a href='https://ko-fi.com/A0A01RVDGT' target='_blank'><img style="display: block; height:36px; margin: 20px auto 10px;" src="https://storage.ko-fi.com/cdn/kofi4.png?v=6" alt="Buy Me a Coffee at ko-fi.com" /></a></div>

      <div v-if="isHelpOpen" class="modal-overlay" @click.self="isHelpOpen = false">
        <div class="help-modal-box">
          <h2>How to use Poppy's Optimizer</h2>
          <div class="help-modal-body">
            <ol>
              <li><strong>Import Data:</strong> Fill the fields yourself or import game data by clicking the <strong>IMPORT JSON</strong> button at the top and paste your raw JSON from Idleon Efficiency or Toolbox.</li>
              <li><strong>Efficiency:</strong> The optimizer calculates "Time Saved per Bluefin Spent". The best upgrade is highlighted in <strong>Green</strong>.</li>
              <li><strong>Auto Buy:</strong> After purchasing the recommended upgrade in-game, click the <strong>"BUY POND: [UPGRADE]"</strong> green button to automatically update your levels.</li>
              <li><strong>Targets:</strong> The blue outline and <strong>TARGET</strong> label indicate your next major goal: either a <strong>Fisheroo Reset</strong> or <strong>Greatest Catch</strong>. You can change it in the <strong>Target</strong> dropdown.</li>
              <li><strong>Fisheroo:</strong> Use <strong>Auto Distribute</strong> to allocate points. The <strong>Red Spiral</strong> acts as a multiplier for all reset bonuses. The optimizer handles this math for you!</li>
              <li><strong>Tartar Fish:</strong> The optimizer currently only recommends Tartar upgrades that directly reduce the time to your Bluefin target. Other Tartar upgrades should be bought according to your own discretion.</li>
              <li><strong>Advanced Bonuses:</strong> Make sure to fill your <strong>Go Go Secret Kangaroo Mouse</strong> bonus and <strong>Gambit</strong> bonus as they significantly impact generation rate calculations.</li>
              <li><strong>Shiny Fish:</strong> Also don't forget to update your <strong>Shiny Multipliers</strong> manually as they are a massive multiplicative factor for your Bluefin generation.</li>
              <li><strong>Reset Upgrades:</strong> The App will not recommend purchasing <strong>Fisheroo Investing</strong> and <strong>Tarrific Resets</strong> upgrades. Remember to buy them before each reset!</li>
            </ol>
          </div>
          <button @click="isHelpOpen = false" class="btn-close-help">GOT IT!</button>
        </div>
      </div>
    </div>
  </div>
</template>c

<style scoped>
.poppy-page { padding: 20px; display: flex; justify-content: center; }
.main-width-wrapper { width: 1120px; }

.page-title-row { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px; padding-top: 10px; }
.page-title { font-size: 1.4rem; font-weight: 900; color: #38bdf8; letter-spacing: 1px; text-shadow: 0 0 10px rgba(56, 189, 248, 0.3); }

.buy-section { background: #1e293b; padding: 15px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 5px; width: 100%; }
.buy-section h3 { text-align: center; margin-bottom: 15px; color: #38bdf8; text-transform: uppercase; font-size: 1rem; font-weight: bold; }
.total-mult-footer { text-align: center; font-size: 1rem; color: #fff; font-weight: 900; margin-top: 15px; text-shadow: 1.5px 1.5px 0 #000; }
.settings-bar-inner { display: flex; justify-content: space-between; align-items: end; width: 100%; gap: 20px; flex-wrap: wrap; padding: 0 5px; }
.justify-end { justify-content: flex-end; }

.val-display { font-size: 1.2rem; font-weight: 900; color: #fff; text-shadow: 1px 1px 0 #000; }

.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label { font-size: 0.75rem; color: #94a3b8; font-weight: bold; white-space: nowrap; }
.styled-input { background: #030712; color: white; border: 1px solid #334155; padding: 8px 12px; border-radius: 4px; font-family: inherit; }
.buy-section .styled-input { background: #0f172a; }
.styled-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; padding-right: 32px; background-color: #030712; }
.buy-section .styled-select { background-color: #0f172a; }
.styled-select option { background: #030712; color: white; }

.btn-auto { background: #10b981; color: white; border: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.8rem; text-shadow: 1px 1px 0 #000; height: 38px; }
.btn-auto.tar-btn { background: #64748b; }
.btn-auto.green-btn { background: #10b981; }
.btn-auto:disabled { opacity: 0.5; cursor: not-allowed; }

.upgrade-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; border: 2px solid #000; width: 100%; margin: 0 auto; overflow: hidden; background: #000; margin-bottom: 30px; }
.upgrade-card { background: #4b8397; border: 1px solid #334155; display: flex; flex-direction: column; padding: 10px; position: relative; gap: 1px; }
.upgrade-card.best { border-color: #10b981; background: #064e3b; }
.target-row { border-left: 5px solid #38bdf8 !important; }

.tar-grid .upgrade-card { background: #4b3a3a; }
.tar-grid .upgrade-card.best { border-color: #10b981; background: #3f2c06; }
.row-top { display: flex; align-items: center; gap: 8px; }
.upg-icon-box { height: 43px; display: flex; align-items: center; justify-content: center; }
.upg-title { font-size: 1rem; font-weight: 900; color: #fff; text-shadow: 1.5px 1.5px 0 #000; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }

.row-mid-refactor { display: flex; align-items: center; justify-content: center; text-shadow: 2px 2px 2px #000; min-height: 60px; }
.upg-mid-box { background: rgba(0, 0, 0, 0.25); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2px; margin: 0 2px; }
.upg-desc-compact { font-size: 0.75rem; color: #fff; font-style: italic; text-align: center; line-height: 1.2; white-space: pre-line; min-height: 2.4em; display: flex; align-items: center; justify-content: center; }
.time-variation { font-size: 1rem; font-weight: 900; font-family: monospace; }
.pos { color: #4ade80; } .neg { color: #f87171; } .target-label { color: #38bdf8;}

.row-bottom-refactor { display: flex; align-items: center; background: rgba(0, 0, 0, 0.4); border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); margin: 0 2px; }
.level-box-mini { width: 80px; border-right: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; padding-left: 6px; }
.lv-label { font-size: 0.7rem; font-weight: bold; margin-right: 2px; }
.level-box-mini input { width: 100%; background: transparent; border: none; font-size: 1rem; text-align: center; color: #fff; outline: none; font-weight: bold; padding: 4px 0; }

.cost-container-mini { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 1.05rem; color: #fff; text-shadow: 1.5px 1.5px 0 #000; font-weight: bold; font-family: monospace; }
.fish-mini-icon { width: 14px; height: 14px; }

.spiral-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-top: 20px;}
.spiral-card { background: #111827; border: 2px solid #1e293b; border-radius: 12px; padding: 15px; display: flex; align-items: center; gap: 2px; user-select: none; }
.spiral-left { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 60px; }
.spiral-icon-box { border-radius: 10px; padding: 8px; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; border: 1px solid rgba(255,255,255,0.05); }
.spiral-icon { object-fit: contain; }
.level-input-simple { background: #030712; border-radius: 6px; border: 1px solid #334155; width: 100%; }
.level-input-simple input { width: 100%; background: transparent; border: none; font-size: 1.1rem; text-align: center; color: #fff; outline: none; font-weight: bold; padding: 3px 0; }
.spiral-right { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; }
.spiral-desc { font-size: 0.85rem; font-weight: 800; line-height: 1.3; }

.shiny-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; }
.shiny-slot { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.shiny-icon-box { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; }
.shiny-icon { width: 40px; height: 40px; object-fit: contain; }
.shiny-input-row { display: flex; align-items: center; gap: 3px; font-size: 1rem; color: #94a3b8; font-weight: bold; background: #030712; padding: 4px 8px; border-radius: 6px; border: 1px solid #334155; }
.shiny-input-row input { width: 60px; background: transparent; border: none; color: #fff; text-align: center; font-weight: bold; outline: none; font-size: 1.1rem; }

.help-btn { background: #1e293b; border: 1px solid #334155; color: #38bdf8; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; }
.help-btn:hover { background: #334155; color: white; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.help-modal-box { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 665px; width: 90%; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); max-height: 90vh; display: flex; flex-direction: column; justify-content: space-between; }
.help-modal-body { overflow-y: auto; flex: 1; margin-bottom: 20px; padding-right: 10px; }
.help-modal-box h2 { color: #38bdf8; margin-bottom: 20px; }
.help-modal-box ol { padding-left: 20px; color: #cbd5e1; }
.help-modal-box li { margin-bottom: 12px; line-height: 1.5; }
.help-modal-box strong { color: #f8fafc; }
.btn-close-help { margin-top: 20px; width: 100%; background: #38bdf8; color: #000; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-close-help:hover { filter: brightness(1.1); }
.best-upg-hidden { color: transparent; height: 15px; }
</style>
