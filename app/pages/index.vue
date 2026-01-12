<script setup lang="ts">
const tools = [
  {
    name: 'Bubba',
    description: "Bubba the Chonky Seal's Arctic Market of Meats optimizer",
    icon: '/bubba/meat-icon.png',
    route: '/bubba',
    color: '#f472b6'
  },
  {
    name: 'Orion',
    description: "Orion the Great Horned Owl's Feather Enterprise optimizer",
    icon: '/orion/mf-1.png',
    route: '/orion',
    color: '#38bdf8'
  }
];
</script>

<template>
  <div class="dashboard-page">
    <div class="dashboard-wrapper">
      <h1 class="dashboard-title">IDLEON OPTIMIZERS</h1>
      <p class="dashboard-subtitle">Choose a tool to get started</p>

      <div class="tools-grid">
        <NuxtLink v-for="tool in tools" :key="tool.name" :to="tool.route" class="tool-card">
          <div class="tool-icon-box" :style="{ borderColor: tool.color }">
            <img :src="tool.icon" class="tool-icon" />
          </div>
          <div class="tool-info">
            <h2 class="tool-name" :style="{ color: tool.color }">{{ tool.name }}</h2>
            <p class="tool-desc">{{ tool.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 60px);
}

.dashboard-wrapper {
  width: 800px;
  text-align: center;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 900;
  color: #38bdf8;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
  margin-bottom: 10px;
}

.dashboard-subtitle {
  color: #94a3b8;
  font-size: 1rem;
  margin-bottom: 50px;
}

.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tool-card {
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 25px 30px;
  display: flex;
  align-items: center;
  gap: 25px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tool-card:hover {
  background: #1e293b;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.tool-icon-box {
  width: 70px;
  height: 70px;
  background: #030712;
  border: 2px solid;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-icon {
  width: 45px;
  height: 45px;
  object-fit: contain;
}

.tool-info {
  text-align: left;
}

.tool-name {
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 5px;
}

.tool-desc {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0;
}
</style>
