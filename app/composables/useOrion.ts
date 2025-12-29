export type UpgradeLevels = [number, number, number, number, number, number, number, number, number];

export const useOrion = () => {
  const { formatNumber } = useFormatters();

  const state = reactive({
    levels: [0, 0, 0, 0, 0, 0, 0, 0, 0] as UpgradeLevels,
    currentFeathers: 0,
    shinyCount: 0,
    goGoOwl: 0,
    gambitBonus: 0,
  });

  const UPGRADE_NAMES = [
    "Feather Generation", "Bonuses of Orion", "Feather Multiplier",
    "Feather Cheapener", "Feather Restart", "Super Feather Production",
    "Shiny Feathers", "Super Feather Cheapener", "The Great Mega Reset"
  ];

  const BASE_COSTS = [5, 350, 500, 3000, 1000000, 2000000, 5000000, 50000000, 250000000000];
  const BASE_FACTORS = [1.1, 25, 1.11, 1.16, 14, 1.12, 1.4, 1.27, 20];

  const getEstimatedShiny = (gen: number) => {
    if (gen <= 0) return 0;
    const base = (gen * 0.000001) / 0.2;
    if (base <= 0) return 0;
    return Math.floor(Math.max(0, Math.log(base) / Math.log(1.1)));
  };

  const getUpgradeCost = (index: number, lv: number, levels: UpgradeLevels) => {
    const mfLv = levels[8];
    let factor = BASE_FACTORS[index] || 1.1;
    if (index === 0 && mfLv >= 9) factor = 1.075;

    let cost = (BASE_COSTS[index] || 0) * Math.pow(factor, lv);
    if (index === 0 && lv > 0) cost = cost * lv;

    const r3 = 1 / (1 + levels[3] / 10);
    const r7 = 1 / (1 + levels[7] / 5);
    cost = cost * r3 * r7;

    if (mfLv >= 3 && levels[0] > 0) {
      const r0 = 1 / (1 + levels[0] / 100);
      cost = cost * r0;
    }
    return cost;
  };

  const getFeatherGen = (levels: UpgradeLevels, owl: number, gambit: number, shiny: number) => {
    const mfLv = levels[8];
    let baseGen = (levels[0] * 1) + (levels[5] * 5);
    if (mfLv >= 5) baseGen += (levels[3] * 2) + (levels[7] * 4);
    if (baseGen === 0) return 0;

    const featherMult = 1 + levels[2] / 20;
    const shinyMult = 1 + (shiny * levels[6] / 100);
    const restartBase = mfLv >= 7 ? 5 : 3;
    const restartMult = Math.pow(restartBase, levels[4]);
    const mf1Mult = mfLv >= 1 ? 10 : 1;
    const owlMult = 1 + (owl / 100);
    const gambitMult = gambit > 0 ? gambit : 1;

    return owlMult * restartMult * baseGen * featherMult * shinyMult * mf1Mult * gambitMult;
  };

  const getUpgradeDescription = (index: number, levels: UpgradeLevels) => {
    const mfLv = levels[8];
    switch (index) {
      case 0: {
        const red = (levels[0] / (levels[0] + 100)) * 100;
        const redText = mfLv >= 3 ? `, and lowers all costs by ${red.toFixed(1)}%` : "";
        return `Generates +${formatNumber(levels[0])} feather per second${redText}`;
      }
      case 1: return `Gain a permanent bonus in the real game! This upgrade never resets.`;
      case 2: return `Boosts feather generation by +${formatNumber(levels[2] * 5)}%`;
      case 3: {
        const red = (levels[3] / (levels[3] + 10)) * 100;
        const bonus = mfLv >= 5 ? ` (+${formatNumber(levels[3] * 2)} f/s)` : "";
        return `All feather upgrades are ${red.toFixed(1)}% cheaper.${bonus}`;
      }
      case 4: return `Reset almost all Upgrades and Feathers. Generate ${formatNumber(Math.pow(mfLv >= 7 ? 5 : 3, levels[4]))}x Feathers`;
      case 5: return `Generates +${formatNumber(levels[5] * 5)} more feathers per second`;
      case 6: return `Rare chance for Shiny Feather, each one gives +${levels[6]}% feather generation`;
      case 7: {
        const red = levels[7] * 20;
        const bonus = mfLv >= 5 ? ` (+${formatNumber(levels[7] * 4)} f/s)` : "";
        return `All feather upgrades are ${formatNumber(red)}% cheaper.${bonus}`;
      }
      case 8: return `Reset almost everything. Gain a permanent Megafeather`;
      default: return "";
    }
  };

  const getFutureEfficientCost = (initialLevels: UpgradeLevels, effectiveShiny: number) => {
    let totalPathCost = 0;
    const tempLevels = [...initialLevels] as UpgradeLevels;
    const validIndices = [0, 2, 3, 5, 6, 7];

    for (let step = 0; step < 100; step++) {
      let bestStepIdx = -1;
      let maxStepEff = 0;

      const rCost = getUpgradeCost(4, tempLevels[4], tempLevels);
      const mCost = getUpgradeCost(8, tempLevels[8], tempLevels);
      const targetIdx = mCost < rCost ? 8 : 4;
      const targetCost = Math.min(rCost, mCost);
      const currentGen = getFeatherGen(tempLevels, state.goGoOwl, state.gambitBonus, effectiveShiny);

      if (currentGen <= 0) break;

      for (const idx of validIndices) {
        const cost = getUpgradeCost(idx, tempLevels[idx] as number, tempLevels);
        const simLevels = [...tempLevels] as UpgradeLevels;
        (simLevels as any)[idx]++;

        const nextGen = getFeatherGen(simLevels, state.goGoOwl, state.gambitBonus, effectiveShiny);
        const nextTargetCost = getUpgradeCost(targetIdx, tempLevels[targetIdx] as number, simLevels);

        const timeSaved = (targetCost / currentGen) - (nextTargetCost / nextGen);
        const efficiency = timeSaved / cost;

        if (efficiency > maxStepEff) {
          maxStepEff = efficiency;
          bestStepIdx = idx;
        }
      }

      if (bestStepIdx !== -1 && maxStepEff > 0) {
        totalPathCost += getUpgradeCost(bestStepIdx, tempLevels[bestStepIdx] as number, tempLevels);
        (tempLevels as any)[bestStepIdx]++;
      } else {
        break;
      }
    }
    return totalPathCost;
  };

  const featherGen = computed(() => getFeatherGen(state.levels, state.goGoOwl, state.gambitBonus, state.shinyCount));

  const target = computed(() => {
    const rCost = getUpgradeCost(4, state.levels[4], state.levels);
    const mCost = getUpgradeCost(8, state.levels[8], state.levels);
    return mCost < rCost
      ? { name: UPGRADE_NAMES[8], cost: mCost, index: 8 }
      : { name: UPGRADE_NAMES[4], cost: rCost, index: 4 };
  });

  const upgradeAnalysis = computed(() => {
    const rawGen = featherGen.value;
    const targetIdx = target.value.index;
    const effectiveShiny = state.shinyCount > 0 ? state.shinyCount : getEstimatedShiny(rawGen);
    const effectiveGen = getFeatherGen(state.levels, state.goGoOwl, state.gambitBonus, effectiveShiny);
    const futureBurdenCost = getFutureEfficientCost(state.levels, effectiveShiny);
    const currentTargetCost = target.value.cost;
    const currentTotalBurden = currentTargetCost + futureBurdenCost;
    const currentTimeToBurden = effectiveGen > 0 ? (currentTotalBurden - state.currentFeathers) / effectiveGen : Infinity;

    return UPGRADE_NAMES.map((name, i) => {
      const buyCost = getUpgradeCost(i, state.levels[i] as number, state.levels);
      const nextLevels = [...state.levels] as UpgradeLevels;
      (nextLevels as any)[i]++;

      const nextGen = getFeatherGen(nextLevels, state.goGoOwl, state.gambitBonus, effectiveShiny);
      const nextTargetCost = getUpgradeCost(targetIdx, state.levels[targetIdx] as number, nextLevels);
      const nextFutureBurdenCost = getFutureEfficientCost(nextLevels, effectiveShiny);

      const nextTotalBurden = nextTargetCost + nextFutureBurdenCost;
      const feathersAfterBuy = state.currentFeathers - buyCost;
      const nextTimeToBurden = nextGen > 0 ? (nextTotalBurden - feathersAfterBuy) / nextGen : Infinity;

      const timeSaved = currentTimeToBurden - nextTimeToBurden;

      return {
        name,
        cost: buyCost,
        description: getUpgradeDescription(i, state.levels),
        timeSaved: timeSaved,
        efficiency: (buyCost > 0 && timeSaved > 0) ? timeSaved / buyCost : 0,
        icon: `/orion/upg-${i}.png`
      };
    });
  });

  const bestUpgradeIndex = computed(() => {
    let bestIdx = -1;
    let maxEff = 0;
    upgradeAnalysis.value.forEach((upg, i) => {
      if (i === 1 || i === 4 || i === 8) return;
      if (upg.efficiency > maxEff) {
        maxEff = upg.efficiency;
        bestIdx = i;
      }
    });
    return bestIdx;
  });

  const timeToTarget = computed(() => {
    if (featherGen.value <= 0) return Infinity;
    const diff = target.value.cost - state.currentFeathers;
    return diff <= 0 ? 0 : diff / featherGen.value;
  });

  return { state, UPGRADE_NAMES, featherGen, target, timeToTarget, upgradeAnalysis, bestUpgradeIndex };
};