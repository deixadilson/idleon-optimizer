<script setup lang="ts">
import { inject } from '@vercel/analytics';
const { state: bubbaState } = useBubba();
const { state: orionState } = useOrion();
const { state: poppyState } = usePoppy();
const isModalOpen = ref(false);
const jsonInput = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
  
if (import.meta.client) inject();

watch(isModalOpen, (val) => {
  if (val) {
    nextTick(() => {
      textareaRef.value?.focus();
    });
  }
});

const importJson = () => {
  try {
    const rawData = JSON.parse(jsonInput.value);
    
    let bubbaDataRaw = null;
    const bObj = rawData.data || rawData;
    
    if (bObj.bubba || bObj.Bubba) {
      bubbaDataRaw = bObj.bubba || bObj.Bubba;
    } else if (bObj.cloudData?.bubba) {
      bubbaDataRaw = bObj.cloudData.bubba;
    } else if (Array.isArray(rawData) && Array.isArray(rawData[0]) && Array.isArray(rawData[1])) {
      bubbaDataRaw = rawData;
    }

    if (bubbaDataRaw) {
      const b = typeof bubbaDataRaw === 'string' ? JSON.parse(bubbaDataRaw) : bubbaDataRaw;
      
      if (b[0] && Array.isArray(b[0])) {
        bubbaState.currentMeat = parseFloat(b[0][0]) || 0;
        if (b[0][2] !== undefined) bubbaState.selectedGifts[0] = parseInt(b[0][2]) - 1;
        if (b[0][3] !== undefined) bubbaState.selectedGifts[1] = parseInt(b[0][3]) - 1;
      }
      
      if (b[1] && b[2] && Array.isArray(b[1]) && Array.isArray(b[2])) {
        bubbaState.levels = b[1].map((v: any, i: number) => (parseInt(v) || 0) + (parseInt(b[2][i]) || 0));
        bubbaState.mindfulOffsets = b[2].map((v: any) => parseInt(v) || 0);
      }
      
      if (b[3] && Array.isArray(b[3])) {
        bubbaState.charismaLvs = [...b[3]].map(v => parseInt(v) || 0) as [number, number, number, number, number, number];
      }
      if (b[4] && Array.isArray(b[4])) {
        bubbaState.diceValues = b[4].map(v => parseInt(v) || 0);
      }
      if (b[5] && Array.isArray(b[5])) {
        bubbaState.smokerValues = b[5].map(v => parseInt(v) || 0);
      }
    }

    const optLacc = rawData.OptLacc || (rawData.data && rawData.data.OptLacc);
    if (optLacc && Array.isArray(optLacc)) {
      let foundIndex = -1;
      if (optLacc.length > 253) {
        const isMarkersMatch = optLacc[245] === 1 && optLacc[246] === 26;
        if (isMarkersMatch || (parseFloat(optLacc[253]) > 0 && Array.isArray(optLacc.slice(254, 263)))) {
           foundIndex = 253;
        }
      }
      if (foundIndex === -1) {
        for (let i = 0; i < optLacc.length - 12; i++) {
          if (optLacc[i] === 1 && optLacc[i+1] === 26 && optLacc[i+2] === 1 && optLacc[i+3] === 1 && 
              optLacc[i+4] === 1 && optLacc[i+5] === 1 && optLacc[i+6] === 1 && optLacc[i+7] === 1) {
            foundIndex = i + 8;
            break;
          }
        }
      }
      if (foundIndex !== -1) {
        orionState.currentFeathers = parseFloat(optLacc[foundIndex]) || 0;
        const levelsSlice = optLacc.slice(foundIndex + 1, foundIndex + 10);
        orionState.levels = levelsSlice.map(v => parseInt(v) || 0) as [number, number, number, number, number, number, number, number, number];
        orionState.shinyCount = parseInt(optLacc[foundIndex + 11]) || 0;
      }

      if (optLacc.length > 304) {
        poppyState.currentFish = parseFloat(optLacc[267]) || 0;
        
        const pondSlice = optLacc.slice(268, 280);
        poppyState.pondLevels = pondSlice.map(v => parseInt(v) || 0);

        const shinySlice = optLacc.slice(281, 287);
        const shinyBases = [30, 50, 100, 150, 250, 500];
        poppyState.shinyMultipliers = shinySlice.map((v, i) => {
          const amt = parseFloat(v) || 0;
          const base = shinyBases[i] || 1;
          return amt > 0 ? (1 + (base * Math.log(Math.max(1, amt))) / 100) : 1;
        });

        const unusedPoints = parseFloat(optLacc[290]) || 0;
        const fisherooSlice = optLacc.slice(291, 296);
        const fLevels = fisherooSlice.map(v => parseInt(v) || 0);
        poppyState.fisherooLevels = fLevels;
        poppyState.totalFisherooPoints = fLevels.reduce((a, b) => a + b, 0) + unusedPoints;

        const tarSlice = optLacc.slice(297, 305);
        poppyState.tarLevels = tarSlice.map(v => parseInt(v) || 0);

        bubbaState.poppyFishPower = Math.log10(Math.max(1, poppyState.currentFish));
      }
    }

    const upgVault = rawData.UpgVault || (rawData.data && rawData.data.UpgVault);
    if (upgVault && Array.isArray(upgVault)) {
      const lv21 = parseInt(upgVault[21]) || 0;
      const lv32 = parseInt(upgVault[32]) || 0;
      orionState.goGoOwl = Math.round(lv21 * 5 * (1 + lv32 * 0.01));

      const lv45 = parseInt(upgVault[45]) || 0;
      const lv61 = parseInt(upgVault[61]) || 0;
      poppyState.goGoSecretKangaroo = lv45 * 10 * (1 + lv61 * 0.01);
    }

    let discoveredGambitVal = 0;
    const caverns = rawData.Caverns || (rawData.data && rawData.data.Caverns);
    if (Array.isArray(caverns) && caverns[8]) discoveredGambitVal = parseFloat(caverns[8]);

    let holesData = rawData.Holes || (rawData.data && rawData.data.Holes);

    if (holesData) {
      const h = typeof holesData === 'string' ? JSON.parse(holesData) : holesData;
      
      if (Array.isArray(h[28]) && h[28][8]) {
        discoveredGambitVal = Math.max(discoveredGambitVal, parseFloat(h[28][8]));
      }
      
      const gambitSurvivalData = Array.isArray(h[11]) ? h[11] : [];
      let basePoints = 0;
      
      if (gambitSurvivalData.length > 60) {
        const times = gambitSurvivalData.slice(65, 71).map((v: any) => parseFloat(v) || 0);
        
        const getSurvivalScore = (seconds: number) => {
          if (!seconds) return 0;
          return (100 * seconds) + (300 * Math.floor(seconds / 10)) + (1000 * Math.floor(seconds / 60));
        };

        basePoints = times.reduce((sum: number, t: number, i: number) => {
          const mult = i > 0 ? 2 : 1; 
          return sum + (getSurvivalScore(t) * mult);
        }, 0);
      }

      // Extract Arcane data for Tesseract bonus
      const arcaneData = rawData.Arcane || (rawData.data && rawData.data.Arcane);
      const arcaneRaw = typeof arcaneData === 'string' ? JSON.parse(arcaneData) : arcaneData;

      // Calculated Multiplier Formula (Strict User Indices & Hardcoded Constants)
      let calcMultiSum = 0;

      // 1. Measurement Bonus
      // Index: Holes[12][13] (User said value 217)
      let measureLev = 0;
      if (Array.isArray(h[12]) && parseFloat(h[12][13]) > 0) measureLev = parseFloat(h[12][13]);
      else if (Array.isArray(h[22]) && parseFloat(h[22][13]) > 0) measureLev = parseFloat(h[22][13]); 
      
      if (measureLev > 0) {
        // Cosmo Bonus: Holes[4][0]
        const cosmoLev = (h[4] && h[4][0]) ? parseFloat(h[4][0]) : 0;
        const cosmoMulti = 1 + (25 * cosmoLev) / 100;
        
        // Base Formula: Cosmo * (10 * Lev / (100 + Lev))  [Base 10 hardcoded]
        const baseVal = 10;
        const baseBonus = cosmoMulti * (baseVal * measureLev / (100 + measureLev));
        
        // Quantity Multi (DeathNote Pts)
        const deathNoteSum = Object.values(rawData?.data?.DeathNote || rawData?.DeathNote || {}).reduce((acc: number, x: any) => acc + (x.rank || 0), 0);
        const quantity = deathNoteSum / 125;
        const measurementMulti = quantity < 5 
           ? 1 + (18 * quantity) / 100 
           : 1 + (18 * quantity + 8 * (quantity - 5)) / 100;
           
        const totalMeasurement = baseBonus * measurementMulti;
        calcMultiSum += totalMeasurement;
        console.log(`Measurement: Lev=${measureLev} (217), Cosmo=${cosmoMulti}x (2), BaseBonus=${baseBonus.toFixed(2)} (13.6), DN_Multi=${measurementMulti.toFixed(2)}x (4.24x), Total=${totalMeasurement.toFixed(2)} (58%)`);
      }

      // 2. Study Bonus
      // Index: Holes[26][13] -> 5 * Level
      let studyLev = 0;
      if (Array.isArray(h[26])) studyLev = parseFloat(h[26][13]) || 0;
      if (studyLev) {
         const sBonus = studyLev * 5;
         calcMultiSum += sBonus;
         console.log(`Study: Lev=${studyLev} (20), Bonus=${sBonus} (100%)`);
      }

      // 3. Schematic Bonus
      // Index: Holes[13][74] -> If 1, add 10
      if (Array.isArray(h[13]) && h[13][74] && parseFloat(h[13][74]) === 1) {
        calcMultiSum += 10;
        console.log("Schematic: Active (+10)");
      }

      // 4. Monument Bonus
      // Index: Holes[15][27] -> Val 35
      const monLev = (h[15] && h[15][27]) ? parseFloat(h[15][27]) : 0;
      if (monLev > 0) {
        const monVal = 35; // Hardcoded from holesInfo37 index 27
        // Cosmo: Holes[4][0] (Same index as measurement cosmo)
        const cosmoMonLev = (h[4] && h[4][0]) ? parseFloat(h[4][0]) : 0;
        const cosmoMonMulti = 1 + (25 * cosmoMonLev) / 100;
        
        // Formula: 0.1 * ceil( (Lev / (250 + Lev)) * 10 * Val * Cosmo )
        const rawTerm = (monLev / (250 + monLev)) * 10 * monVal * cosmoMonMulti;
        const monBonus = 0.1 * Math.ceil(rawTerm);
        calcMultiSum += monBonus;
        console.log(`Monument: Lev=${monLev} (362), Val=${monVal} , Cosmo=${cosmoMonMulti}x (2), Bonus=${monBonus.toFixed(2)} (86%)`);
      }

      // 5. Jar Bonus
      // Indices: Holes[24][23] and Holes[24][30]
      // Multiplier: 1.375 (Heuristic based on user observation 8->11%)
      if (Array.isArray(h[24])) {
        const j23 = parseFloat(h[24][23]) || 0;
        const j30 = parseFloat(h[24][30]) || 0;
        const talentFactor = 1.375;
        const jarBonus = (j23 + j30) * talentFactor;
        calcMultiSum += jarBonus;
        console.log(`Jars: J23=${j23}, J30=${j30}, Factor=${talentFactor}, Bonus=${jarBonus.toFixed(2)} (15%)`);
      }

      // 6. Tesseract Bonus
      // Index: Arcane[47] -> 1 * Level
      if (Array.isArray(arcaneRaw) && arcaneRaw[47]) {
        const tessLev = parseFloat(arcaneRaw[47]);
        calcMultiSum += tessLev * 1; 
        console.log(`Tesseract: Lev=${tessLev}, Bonus=${tessLev} (0)`);
      }

      let finalMultiplier = 1 + (calcMultiSum / 100);
      console.log("Final Multiplier:", finalMultiplier);



      // If we used the heuristic basePoints (with doublers), check if Total makes sense
      const totalPoints = basePoints * finalMultiplier;

      if (totalPoints > 0) {
        const bonus = 100 * Math.log10(totalPoints);
        discoveredGambitVal = Math.max(discoveredGambitVal, bonus);
      }
    }
    
    if (discoveredGambitVal > 0) {
      const finalBonus = 1 + discoveredGambitVal / 100;
      //poppyState.gambitBonus = finalBonus;
      //orionState.gambitBonus = finalBonus;
    }
    
    isModalOpen.value = false;
    jsonInput.value = "";
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div class="app-container">
    <header class="global-header">
      <div class="header-content">
        <nav class="main-nav">
          <NuxtLink to="/orion" class="nav-link">Orion</NuxtLink>
          <NuxtLink to="/poppy" class="nav-link">Poppy</NuxtLink>
          <NuxtLink to="/bubba" class="nav-link">Bubba</NuxtLink>
        </nav>
        <button @click="isModalOpen = true" class="import-btn">IMPORT JSON</button>
      </div>
    </header>

    <NuxtPage />

    <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-box">
        <h3>Import Game Data</h3>
        <p>Paste raw JSON from Idleon Efficiency or Toolbox:</p>
        <textarea ref="textareaRef" v-model="jsonInput" placeholder="Paste here..."></textarea>
        <div class="modal-actions">
          <button @click="isModalOpen = false" class="btn-cancel">Cancel</button>
          <button @click="importJson" class="btn-confirm">Import</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background-color: #0c0c16; color: #f8fafc; font-family: 'Courier New', monospace; }

.global-header {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  background: #0c0c16;
}

.header-content {
  width: 1120px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-nav { display: flex; gap: 30px; }

.nav-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 900;
  font-size: 1rem;
  text-transform: uppercase;
  padding: 4px 0;
}

.nav-link:hover { filter: brightness(1.2); }
.router-link-active { border-bottom: 2px solid #38bdf8; }

.import-btn {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-family: inherit;
  font-size: 0.75rem;
}

.import-btn:hover { background: #1e293b; color: white; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-box {
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #334155;
  width: 550px;
}

textarea {
  width: 100%; height: 180px; background: #030712; color: #4ade80;
  border: 1px solid #334155; padding: 10px; font-family: monospace;
  font-size: 0.7rem; border-radius: 6px; resize: none; margin: 10px 0;
}

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: #334155; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-confirm { background: #38bdf8; border: none; color: #000; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
</style>