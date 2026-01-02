<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';

const { state, meatGen, target, upgradeAnalysis, bestUpgradeIndex, getHMultFromHappiness, charismaBonuses, MINDFUL_RESTRICTED, diceStats, diceMulti } = useBubba();
const { formatNumber, parseNumber, formatTime } = useFormatters();

const meatInputDisplay = ref("");
const poppyInputDisplay = ref("");

onMounted(() => { 
  meatInputDisplay.value = formatNumber(state.currentMeat); 
  poppyInputDisplay.value = state.poppyFishPower > 0 ? formatNumber(Math.pow(10, state.poppyFishPower)) : "0";
});

watch(() => state.currentMeat, (v) => meatInputDisplay.value = formatNumber(v));

const handleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  const parsed = parseNumber(val);
  if (!isNaN(parsed)) state.currentMeat = Math.max(0, parsed);
};

const handleBlur = () => { meatInputDisplay.value = formatNumber(state.currentMeat); };

const handlePoppyBlur = () => {
  const parsed = parseNumber(poppyInputDisplay.value);
  const val = Math.max(0, parsed);
  state.poppyFishPower = val > 0 ? Math.log10(val) : 0;
  poppyInputDisplay.value = formatNumber(val);
};

const buyBest = () => {
  const idx = bestUpgradeIndex.value;
  if (idx !== -1) {
    state.currentMeat = Math.max(0, state.currentMeat - upgradeAnalysis.value[idx].cost);
    state.levels[idx]++;
    state.mindfulOffsets[idx] = state.mindfulOffsets[idx];
  }
};

const buyMindful = () => {
  const idx = bestUpgradeIndex.value;
  if (idx !== -1 && !MINDFUL_RESTRICTED.includes(idx)) {
    state.currentMeat = Math.max(0, state.currentMeat - upgradeAnalysis.value[idx].cost);
    state.levels[idx] += 2;
    state.mindfulOffsets[idx] += 1;
  }
};

const toggleEmulsify = (idx: number) => {
  if (state.levels[8] < 6) return;
  state.emulsifiedIndex = state.emulsifiedIndex === idx ? null : idx;
};

const cycleGift = (slot: number, direction: number) => {
    let next = state.selectedGifts[slot];
    const otherSlot = slot === 0 ? 1 : 0;
    do {
      next += direction;
      if (next < -1) next = 5;
      if (next > 5) next = -1;
    } while (next !== -1 && next === state.selectedGifts[otherSlot]);
    state.selectedGifts[slot] = next;
};

const adjustMindfulOffset = (idx: number, delta: number) => {
  const next = state.mindfulOffsets[idx] + delta;
  if (next >= 0 && next < state.levels[idx]) state.mindfulOffsets[idx] = next;
};

const currentH = computed(() => state.activePats * state.levels[1] * charismaBonuses.value.joy * (state.selectedGifts.includes(1) ? 1.5 : 1));
const currentHMult = computed(() => getHMultFromHappiness(currentH.value));

const hTiers = [
    { name: "Amused", min: 1, max: 10.1, color: "#3b82f6" },
    { name: "Beaming", min: 10.1, max: 21.2, color: "#eab308" },
    { name: "Contented", min: 21.2, max: 51, color: "#22c55e" },
    { name: "Delighted", min: 51, max: 140.7, color: "#94a3b8" },
    { name: "Ecstatic", min: 140.7, max: 1000, color: "#a855f7" }
];

const currentTier = computed(() => {
    const m = currentHMult.value;
    return hTiers.find(t => m >= t.min && m < t.max) || hTiers[hTiers.length - 1];
});

const happinessBarHeight = computed(() => {
    const m = currentHMult.value;
    const t = currentTier.value;
    const progress = Math.max(0, m - t.min);
    return `${Math.min(100, (progress / (t.max - t.min)) * 100)}%`;
});

const radarPoints = computed(() => {
  const center = 75, maxRadius = 55, angles = [240, 300, 0, 60, 120, 180];
  if (state.charismaLvs.every(v => v === 0)) return `${center},${center}`;
  return state.charismaLvs.map((lv, i) => {
    const r = Math.min(maxRadius, (lv / 120) * maxRadius + (lv > 0 ? 3 : 0));
    return `${center + r * Math.cos(angles[i] * Math.PI/180)},${center + r * Math.sin(angles[i] * Math.PI/180)}`;
  }).join(' ');
});

const charismaChartData = [
  { id: 'I', name: 'HUSTLE', bonus: (b: any) => `${b.hustle.toFixed(2)}x` },
  { id: 'II', name: 'RIZZ', bonus: (b: any) => `-${(b.rizzDisc * 100).toFixed(1)}% Cost` },
  { id: 'III', name: 'JOY', bonus: (b: any) => `${b.joy.toFixed(2)}x Happiness` },
  { id: 'IV', name: 'COURAGE', bonus: () => `+0% Dice Luk` },
  { id: 'V', name: 'MINDFUL', bonus: (b: any) => `+${b.mindful.toFixed(0)}% 2x LVs` },
  { id: 'VI', name: 'SAVVY', bonus: () => `+0% Coins` },
];

const cycleDiceValue = (idx: number, direction: number) => {
  let val = state.diceValues[idx] || 0;
  val += direction;
  if (val < 0) val = diceStats.value.sides;
  if (val > diceStats.value.sides) val = 0;
  state.diceValues[idx] = val;
};
</script>

<template>
  <div class="bubba-page">
    <div class="main-width-wrapper">
      <header class="dashboard">
        <div class="card"><label>Meat Production Rate</label><div class="val">{{ formatNumber(meatGen) }}/min</div></div>
        <div class="card highlight"><label>Current Target: {{ target.name }}</label><div class="val">{{ formatNumber(target.cost) }}</div></div>
        <div class="card"><label>Time to Target</label><div class="val">{{ formatTime((target.cost - state.currentMeat) / (meatGen / 60)) }}</div></div>
      </header>

      <div class="bonus-row">
        <div class="bonus-box happiness-meter">
          <div class="meter-title" :style="{ color: currentTier.color }">{{ currentTier.name.toUpperCase() }}</div>
          <div class="meter-main">
            <div class="meter-bar"><div class="meter-fill" :style="{ height: happinessBarHeight, backgroundColor: currentTier.color }"></div></div>
            <div class="meter-controls">
              <button @click="state.activePats = Math.min(20, state.activePats + 1)" class="pat-btn">▲</button>
              <div class="pat-label-container">
                  <div class="pat-label-small">pats</div>
                  <div class="pat-val">{{ state.activePats }}</div>
              </div>
              <button @click="state.activePats = Math.max(0, state.activePats - 1)" class="pat-btn">▼</button>
            </div>
          </div>
          <div class="meter-footer">
            <span>Multi: {{ currentHMult.toFixed(2) }}x</span>
            <img src="/bubba/meat-icon.png" class="meat-mini-icon footer-icon" />
          </div>
        </div>

        <div class="bonus-box radar-container">
          <svg width="160" height="150" viewBox="0 0 150 150">
            <polygon v-for="r in [55, 40, 25, 10]" :key="r" :points="`${75 + r * Math.cos(240 * Math.PI/180)},${75 + r * Math.sin(240 * Math.PI/180)} ${75 + r * Math.cos(300 * Math.PI/180)},${75 + r * Math.sin(300 * Math.PI/180)} ${75 + r * Math.cos(0 * Math.PI/180)},${75 + r * Math.sin(0 * Math.PI/180)} ${75 + r * Math.cos(60 * Math.PI/180)},${75 + r * Math.sin(60 * Math.PI/180)} ${75 + r * Math.cos(120 * Math.PI/180)},${75 + r * Math.sin(120 * Math.PI/180)} ${75 + r * Math.cos(180 * Math.PI/180)},${75 + r * Math.sin(180 * Math.PI/180)}`" fill="none" stroke="#38bdf8" stroke-opacity="0.2" stroke-width="1" />
            <polygon :points="radarPoints" fill="rgba(56, 189, 248, 0.4)" stroke="#38bdf8" stroke-width="2" />
            <text v-for="(p, i) in ['I','II','III','IV','V','VI']" :key="p" :x="75 + 68 * Math.cos([240, 300, 0, 60, 120, 180][i] * Math.PI/180)" :y="75 + 68 * Math.sin([240, 300, 0, 60, 120, 180][i] * Math.PI/180) + 5" text-anchor="middle" class="radar-label" :class="{ 'gold-text': state.emulsifiedIndex == i }">{{ p }}</text>
          </svg>
        </div>

        <div class="bonus-box gifts-container">
          <div class="gifts-label">GIFTS</div>
          <div class="gifts-slots">
            <div v-for="slot in [0, 1]" :key="slot" class="gift-slot">
              <button @click="cycleGift(slot, 1)" class="pat-btn">▲</button>
              <div class="gift-img-box"><img v-if="state.selectedGifts[slot] !== -1" :src="`/bubba/gift-${state.selectedGifts[slot] + 1}.png`" class="gift-icon" /><span v-else class="none-text">NONE</span></div>
              <button @click="cycleGift(slot, -1)" class="pat-btn">▼</button>
            </div>
          </div>
        </div>
        <div class="bonus-box dice-container">
          <div class="gifts-label">DICE</div>
          <div class="dice-grid">
            <div v-for="n in Math.min(diceStats.count, state.diceValues.length)" :key="n" class="die-slot">
              <button @click="cycleDiceValue(n-1, 1)" class="pat-btn">▲</button>
              <div class="die-img-box">
                <img v-if="state.diceValues[n-1] > 0" :src="`/bubba/dice-${state.diceValues[n-1]}.png`" class="die-icon" />
              </div>
              <button @click="cycleDiceValue(n-1, -1)" class="pat-btn">▼</button>
            </div>
          </div>
          <div class="meter-footer">
            <span>Multi: {{ diceMulti.toFixed(2) }}x</span>
            <img src="/bubba/meat-icon.png" class="meat-mini-icon footer-icon" />
          </div>
        </div>
      </div>

      <div class="settings-bar">
        <div class="input-group"><label>Meat:</label><input type="text" v-model="meatInputDisplay" @input="handleInput" @blur="handleBlur" class="styled-input" style="width: 140px;" /></div>
        <div class="input-group"><label>Poppy Fish Crossover:</label><input type="text" v-model="poppyInputDisplay" @blur="handlePoppyBlur" class="styled-input" style="width: 140px;" /></div>
        <div class="input-group"><label>Pats/Hr:</label><input type="number" step="0.1" min="0" max="10" v-model.number="state.patsPerHour" class="styled-input" style="width: 70px;" /></div>
        <div class="btn-group">
            <button @click="buyBest" class="btn-auto" :class="{ 'btn-wait': bestUpgradeIndex === -1 }">{{ bestUpgradeIndex !== -1 ? 'BUY: ' + upgradeAnalysis[bestUpgradeIndex].name.toUpperCase() : 'WAIT' }}</button>
            <button v-if="bestUpgradeIndex !== -1" @click="buyMindful" class="btn-mindful">BUY MINDFUL ✨</button>
        </div>
      </div>

      <main class="upgrade-grid">
        <div v-for="(upg, i) in upgradeAnalysis" :key="i" class="upgrade-card" :class="{ 'best': i === bestUpgradeIndex, 'is-target': i === target.index }">
          <div class="row-title">{{ upg.name.toUpperCase() }}</div>
          <div class="row-mid">
            <img :src="upg.icon" class="upg-icon" /><div class="level-box"><input type="number" v-model.number="state.levels[i]" min="0" /></div>
          </div>
          <div class="row-time">
            <span v-if="upg.timeSaved > 0" class="time-pos">-{{ formatTime(upg.timeSaved) }}</span>
            <span v-else-if="upg.timeSaved < 0" class="time-neg">+{{ formatTime(Math.abs(upg.timeSaved)) }}</span>
            <span v-else class="time-null">--</span>
          </div>
          <div class="row-cost">
            <div class="cost-container">
              <span :class="{ 'mindful-active': state.mindfulOffsets[i] > 0 }">{{ formatNumber(upg.cost) }}</span>
              <img src="/bubba/meat-icon.png" class="meat-mini-icon" />
            </div>
            <div class="cost-adj-controls" v-if="!MINDFUL_RESTRICTED.includes(i)">
              <button @click="adjustMindfulOffset(i, -1)" class="cost-chevron">▲</button>
              <button @click="adjustMindfulOffset(i, 1)" class="cost-chevron">▼</button>
            </div>
          </div>
        </div>
      </main>

      <section class="charisma-main-card">
        <div v-for="(attr, idx) in charismaChartData" :key="attr.id" 
          class="attr-cell" :class="{ 'emulsified': state.emulsifiedIndex === idx }"
          @dblclick="toggleEmulsify(idx)"
        >
          <div class="attr-top">
            <div class="attr-roman" :class="{ 'gold-text': state.emulsifiedIndex === idx }">{{ attr.id }}</div>
            <div class="attr-mid-info">
              <span class="attr-name">{{ attr.name }}</span>
              <div class="attr-input-line"><span>Lv.</span><input type="number" v-model.number="state.charismaLvs[idx]" min="0" /></div>
            </div>
          </div>
          <div class="attr-desc-line">
            <template v-if="attr.id === 'I'">{{ attr.bonus(charismaBonuses) }} <img src="/bubba/meat-icon.png" class="mini-meat" /></template>
            <template v-else>{{ attr.bonus(charismaBonuses) }}</template>
          </div>
        </div>
      </section>

      <section class="mf-section">
        <h3>Megaflesh Tier Bonuses</h3>
        <div class="mf-grid">
          <div v-for="n in 12" :key="n" class="mf-slot" :style="{ opacity: state.levels[8] >= n ? 1 : 0.2 }"><img :src="`/bubba/mf-${n}.png`" class="mf-icon" /><div v-if="n === 12 && state.levels[8] > 12" class="mf-badge">+{{ state.levels[8] - 12 }}</div></div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bubba-page { padding: 20px; display: flex; justify-content: center; }
.main-width-wrapper { width: 1120px; }
.bonus-row { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 25px; background: #111827; padding: 20px; border-radius: 12px; border: 1px solid #1e293b; align-items: center; width: 100%; }
.happiness-meter { width: 160px; display: flex; flex-direction: column; align-items: center; }
.meter-title { font-weight: 900; font-size: 0.9rem; margin-bottom: 10px; text-shadow: 1px 1px 0 #000; text-align: center; }
.meter-main { display: flex; gap: 15px; align-items: center; justify-content: center; height: 100px; width: 100%; }
.meter-bar { width: 22px; height: 100%; background: #030712; border: 2px solid #334155; border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; }
.meter-fill { width: 100%; transition: height 0.3s ease; }
.pat-label-container { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 4px 0; }
.pat-label-small { font-size: 0.65rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; line-height: 1; }
.pat-val { font-size: 1.4rem; font-weight: 900; text-align: center; line-height: 1.1; color: #fff; }
.pat-btn { background: #1f2937; color: white; border: 1px solid #374151; cursor: pointer; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; width: 30px; }
.meter-footer { margin-top: 10px; font-size: 0.85rem; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; color: #38bdf8; }
.footer-icon { vertical-align: middle; width: 18px; height: 18px; }
.radar-label { fill: #38bdf8; font-size: 14px; font-weight: 900; text-shadow: 1px 1px 2px #000; pointer-events: none; }
.gold-text { fill: #fbbf24 !important; color: #fbbf24 !important; font-weight: 900 !important; }
.gifts-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 150px; text-align: center; }
.dice-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-width: 150px; }
.dice-grid { display: flex; gap: 8px; align-items: center; justify-content: center; }
.die-slot { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.die-img-box { width: 44px; height: 44px; background: #030712; border: 2px solid #1e293b; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.die-icon { width: 34px; height: 34px; object-fit: contain; }
.gifts-label { font-weight: 900; color: #94a3b8; font-size: 0.8rem; letter-spacing: 2px; margin-bottom: 5px; }
.gifts-slots { display: flex; gap: 10px; justify-content: center; }
.gift-slot { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.gift-img-box { width: 50px; height: 50px; background: #030712; border: 2px solid #1e293b; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.gift-icon { width: 40px; height: 40px; object-fit: contain; }
.none-text { font-size: 0.6rem; color: #475569; font-weight: bold; }
.btn-group { display: flex; gap: 10px; height: 42px; }
.btn-auto { background: #10b981; color: white; border: none; padding: 0 20px; border-radius: 6px; font-weight: bold; cursor: pointer; height: 100%; display: flex; align-items: center; font-size: 0.9rem; text-shadow: 1px 1px 0 #000; }
.btn-mindful { background: #fbbf24; color: #000; border: none; padding: 0 20px; border-radius: 6px; font-weight: bold; cursor: pointer; height: 100%; display: flex; align-items: center; font-size: 0.9rem; }
.btn-wait { background: #444; color: #888; cursor: not-allowed; }
.charisma-main-card { background: #111827; padding: 20px; border: 2px solid #1e293b; border-radius: 12px; display: flex; justify-content: space-around; width: 100%; margin-bottom: 30px; user-select: none; }
.attr-cell { display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid transparent; border-radius: 8px; width: 165px; cursor: pointer; }
.attr-cell.emulsified { border-color: #fbbf24; background: rgba(251, 191, 36, 0.05); }
.attr-top { display: flex; align-items: center; gap: 10px; }
.attr-roman { font-size: 2.2rem; min-width: 45px; text-align: center; font-weight: 900; color: #38bdf8; text-shadow: 2px 2px 0 #000; }
.attr-mid-info { display: flex; flex-direction: column; }
.attr-name { font-size: 0.8rem; color: #fff; font-weight: bold; }
.attr-input-line { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #94a3b8; }
.attr-input-line input { width: 45px; background: #030712; border: 1px solid #334155; color: #fff; text-align: center; border-radius: 4px; font-weight: bold; font-family: inherit; }
.attr-desc-line { font-size: 0.75rem; font-weight: 800; color: #cbd5e1; border-top: 1px solid #1e293b; padding-top: 6px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px; }
.mini-meat { width: 16px; height: 16px; vertical-align: middle; }
.upgrade-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 2px solid #000; width: 100%; margin: 0 auto 30px auto; }
.upgrade-card { background: #b397b3; border: 1px solid #000; display: flex; flex-direction: column; }
.upgrade-card.best { outline: 4px solid #10b981; z-index: 5; }
.row-title, .cost-container, .level-box input, .row-time { color: #fff; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; font-weight: bold; }
.row-title { height: 40px; display: flex; align-items: center; text-align: center; justify-content: center; font-size: 1.1rem; background: rgba(0,0,0,0.1); }
.row-mid { display: flex; align-items: center; justify-content: space-around; padding: 8px 5px; }
.upg-icon { width: 60px; height: 35px; object-fit: contain; }
.level-box { background: rgba(0,0,0,0.4); border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
.level-box input { width: 55px; background: transparent; border: none; font-size: 1.3rem; text-align: center; outline: none; }
.row-time { display: flex; align-items: center; justify-content: center; min-height: 25px; padding-bottom: 5px; font-size: 0.9rem; }
.time-pos { color: #4ade80; } .time-neg { color: #f87171; }
.row-cost { height: 34px; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; margin: 0 4px 4px 4px; position: relative; }
.cost-container { display: flex; align-items: center; gap: 4px; font-size: 1.1rem; }
.mindful-active { color: #fbbf24; }
.cost-adj-controls { position: absolute; right: 5px; display: flex; flex-direction: column; gap: 2px; }
.cost-chevron { background: #334155; border: none; color: white; width: 14px; height: 14px; font-size: 0.5rem; border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
</style>