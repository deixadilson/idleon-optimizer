<script setup lang="ts">
const { state: bubbaState } = useBubba();
const isModalOpen = ref(false);
const jsonInput = ref("");

const importJson = () => {
  try {
    const rawData = JSON.parse(jsonInput.value);
    let bubbaDataRaw = rawData.bubba || rawData.Bubba || (rawData.data && (rawData.data.bubba || rawData.data.Bubba));
    if (bubbaDataRaw) {
      const b = typeof bubbaDataRaw === 'string' ? JSON.parse(bubbaDataRaw) : bubbaDataRaw;

      if (b[0]) {
        bubbaState.currentMeat = parseFloat(b[0][0]) || 0;
        bubbaState.selectedGifts[0] = parseInt(b[0][2]) - 1;
        bubbaState.selectedGifts[1] = parseInt(b[0][3]) - 1;
      }

      if (b[1] && b[2]) {
        bubbaState.levels = b[1].map((v: number, i: number) => v + (b[2][i] || 0));
        bubbaState.mindfulOffsets = [...b[2]];
      }

      if (b[3]) bubbaState.charismaLvs = [...b[3]];
      if (b[4]) bubbaState.diceValues = [...b[4]];
      if (b[5]) bubbaState.smokerValues = [...b[5]];

      isModalOpen.value = false;
      jsonInput.value = "";
    }
  } catch (e) {
    console.error("Failed to parse JSON", e);
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
        <textarea v-model="jsonInput" placeholder="Paste here..."></textarea>
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