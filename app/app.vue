<script setup lang="ts">
import { inject } from '@vercel/analytics';
const { state: bubbaState } = useBubba();
const { state: orionState } = useOrion();
const isModalOpen = ref(false);
const jsonInput = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
  
if (import.meta.client) {
  inject();
}

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
    }

    const upgVault = rawData.UpgVault || (rawData.data && rawData.data.UpgVault);
    if (upgVault && Array.isArray(upgVault)) {
      const lv21 = parseInt(upgVault[21]) || 0;
      const lv32 = parseInt(upgVault[32]) || 0;
      orionState.goGoOwl = Math.round(lv21 * 5 * (1 + lv32 * 0.01));
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