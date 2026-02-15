<script setup lang="ts">
const { state: orionState, featherGen, getUpgradeCost: getOrionCost } = useOrion();
const { state: poppyState, pondGen, getPondUpgradeCost } = usePoppy();
const { state: bubbaState, meatGen, target: bubbaTarget, getUpgradeCost: getBubbaCost } = useBubba();
const { formatTime } = useFormatters();

const orionMegaCost = computed(() => {
  return getOrionCost(8, orionState.levels[8], orionState.levels);
});

const poppyMegaCost = computed(() => {
  return getPondUpgradeCost(11, poppyState.pondLevels[11] || 0);
});

const bubbaMegaCost = computed(() => {
  return getBubbaCost(8, bubbaState.levels[8] || 0, bubbaState.mindfulOffsets[8] || 0, bubbaState.levels);
});

const bubbaMegaTime = computed(() => {
  const genPerMin = meatGen.value;
  if (genPerMin <= 0) return Infinity;
  const cost = bubbaMegaCost.value;
  return Math.max(0, (cost - bubbaState.currentMeat) / (genPerMin / 60));
});

const orionMegaTime = computed(() => {
  const genPerSec = featherGen.value;
  if (genPerSec <= 0) return Infinity;
  const cost = orionMegaCost.value;
  const diff = cost - orionState.currentFeathers;
  return diff <= 0 ? 0 : diff / genPerSec;
});

const poppyMegaTime = computed(() => {
  const genPerMin = pondGen.value;
  if (genPerMin <= 0) return Infinity;
  const cost = poppyMegaCost.value;
  return Math.max(0, (cost - poppyState.currentFish) / (genPerMin / 60));
});

const clickers = computed(() => [
  {
    name: 'Orion',
    subtitle: "The Great Horned Owl's<br />Feather Enterprise",
    path: '/orion',
    mfName: 'MegaFeather',
    currentMF: orionState.levels[8],
    timeToNext: orionMegaTime.value,
    icon: '/orion.png',
    color: '#f97316',
    active: orionState.levels.some(l => l > 0) || orionState.currentFeathers > 0
  },
  {
    name: 'Poppy',
    subtitle: "The Kangaroo Mouse's<br />Fish Pond",
    path: '/poppy',
    mfName: 'MegaFish',
    currentMF: poppyState.pondLevels[11] || 0,
    timeToNext: poppyMegaTime.value,
    icon: '/poppy.png',
    color: '#22c55e',
    active: poppyState.pondLevels.some(l => l > 0) || poppyState.currentFish > 0
  },
  {
    name: 'Bubba',
    subtitle: "The Chonky Seal's<br />Arctic Market of Meats",
    path: '/bubba',
    mfName: 'MegaFlesh',
    currentMF: bubbaState.levels[8],
    timeToNext: bubbaMegaTime.value,
    icon: '/bubba.png',
    color: '#38bdf8',
    active: bubbaState.levels.some(l => l > 0) || bubbaState.currentMeat > 0
  }
]);
</script>

<template>
  <div class="landing-page">
    <div class="hero-section">
      <h1 class="main-title">IDLEON <span>OPTIMIZER</span></h1>
      <p class="main-subtitle">A tool to optimize Legends of Idleon player progress.</p>
    </div>

    <div class="clicker-grid">
      <NuxtLink v-for="clicker in clickers" :key="clicker.name" :to="clicker.path" class="clicker-card" :style="{ '--brand-color': clicker.color }">
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="icon-box">
            <img :src="clicker.icon" :alt="clicker.name" />
          </div>
          <div class="card-info">
            <p class="clicker-subtitle" :style="{ color: clicker.color }" v-html="clicker.subtitle"></p>
            
            <div v-if="clicker.active" class="live-stats">
              <div class="stat-col left">
                <span class="label">{{ clicker.mfName }}:</span>
                <span class="val">Tier {{ clicker.currentMF }}</span>
              </div>
              <div class="stat-separator"></div>
              <div class="stat-col right">
                <span class="label">Next {{ clicker.mfName }} in:</span>
                <span class="val highlight">{{ clicker.timeToNext === Infinity ? '---' : formatTime(clicker.timeToNext) }}</span>
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <footer class="landing-footer">
      <a href='https://ko-fi.com/A0A01RVDGT' target='_blank' class="kofi-link">
        <img src="https://storage.ko-fi.com/cdn/kofi5.png?v=6" alt="Buy Me a Coffee" />
      </a>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.05) 0%, transparent 50%);
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
  max-width: 800px;
}

.main-title {
  font-size: 4rem;
  font-weight: 900;
  letter-spacing: -2px;
  margin-bottom: 15px;
  color: #fff;
  line-height: 1;
}

.main-title span {
  color: #38bdf8;
  text-shadow: 0 0 30px rgba(56, 189, 248, 0.4);
}

.main-subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  font-weight: 500;
}

.clicker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
  max-width: 1120px;
  margin-bottom: 80px;
}

.clicker-card {
  position: relative;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 40px 20px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.clicker-card:hover {
  transform: translateY(-10px);
  border-color: var(--brand-color);
  background: rgba(30, 41, 59, 0.6);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, var(--brand-color), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  mix-blend-mode: soft-light;
}

.clicker-card:hover .card-glow {
  opacity: 0.15;
}

.icon-box {
  width: 140px;
  height: 140px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  transition: transform 0.4s ease;
}

.clicker-card:hover .icon-box {
  transform: scale(1.1) rotate(3deg);
}

.icon-box img {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.clicker-subtitle {
  font-size: 1.1rem;
  font-weight: 900;
  margin-bottom: 25px;
  line-height: 1.2;
  height: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.live-stats {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 15px;
  display: flex;
  align-items: stretch;
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

.stat-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-col.left { text-align: left; }
.stat-col.right { text-align: right; }

.stat-separator {
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.stat-col .label {
  font-size: 0.6rem;
  color: #64748b;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-col .val {
  font-size: 0.9rem;
  font-weight: 900;
  color: #fff;
}

.val.highlight {
  color: var(--brand-color);
}

.landing-footer {
  margin-top: auto;
  padding-bottom: 20px;
}

.kofi-link {
  transition: transform 0.2s ease;
  display: block;
}

.kofi-link:hover {
  transform: scale(1.05);
}

.kofi-link img {
  height: 48px;
}

@media (max-width: 1024px) {
  .clicker-grid {
    grid-template-columns: 1fr;
    max-width: 500px;
  }
}
</style>
