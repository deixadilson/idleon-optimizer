export type PoppyLevels = number[];

interface PoppyState {
  pondLevels: PoppyLevels;
  tarLevels: PoppyLevels;
  fisherooLevels: number[];
  currentFish: number;
  currentTarFish: number;
  shinyMultipliers: number[];
  goGoSecretKangaroo: number;
  gambitBonus: number;
  targetMode: 'CHEAPEST' | 'RESET' | 'CATCH';
}

const state = reactive<PoppyState>({
  pondLevels: Array(12).fill(0),
  tarLevels: Array(8).fill(0),
  fisherooLevels: Array(5).fill(0),
  currentFish: 0,
  currentTarFish: 0,
  shinyMultipliers: Array(6).fill(1),
  goGoSecretKangaroo: 0,
  gambitBonus: 1,
  targetMode: 'CHEAPEST',
});

export const usePoppy = () => {
  const POND_UPGRADE_NAMES = [
    "Tasty Fishbait", "Quick Reeling", "Shiny Lure", "Bonuses from Poppy",
    "Fishy Discount", "Juicy Worm", "Fisheroo Reset", "Fishing Buddy",
    "Lightning Quickness", "Fisheroo Investing", "Multihook Fishing", "Greatest Catch"
  ];

  const TAR_UPGRADE_NAMES = [
    "Super Yummy Bait", "Bonus Catching", "Bluefin Frenzy", "Fishy Reduction",
    "Super Tarbait", "Tarrific Resets", "Mongo Multipliers", "King Worm"
  ];

  const POND_BASE_COSTS = [4, 150, 500, 10000, 30000, 150000, 40000000, 1200000000, 600000000, 7500000000, 20000000000, 1500000000000];
  const POND_GROWTH_RATES = [1.06, 1.20, 3.50, 3.00, 1.13, 1.07, 20.00, 7.50, 1.12, 1.70, 1.12, 15.00];

  const TAR_BASE_COSTS = [1, 1, 1, 4, 2, 3, 2, 5];
  const TAR_GROWTH_RATES = [1.15, 1.1, 1.2, 1.15, 1.15, 2, 1.1, 1.2];

  const getPondUpgradeCost = (index: number, lv: number, levels: PoppyLevels = state.pondLevels, tLevels: PoppyLevels = state.tarLevels, fLevels: number[] = state.fisherooLevels) => {
    const base = POND_BASE_COSTS[index] ?? 0;
    const growth = POND_GROWTH_RATES[index] ?? 1;

    const baseMult = index === 0 ? (1 + (levels[0] ?? 0)) : 1;
    const discFromPond = 1 / (1 + (levels[4] ?? 0) * 0.10);
    const discFromTar = 1 / (1 + (tLevels[3] ?? 0) * 0.15);

    const megaFishActive = (levels[11] ?? 0) >= 11 ? 1 : 0;
    const kingWormLv = tLevels[7] ?? 0;
    const discFromMegaFish = 1 / (1 + (megaFishActive * 0.05 * kingWormLv));
    const greenLv = fLevels[2] ?? 0;
    const redMult = 1 + (fLevels[3] ?? 0) * 0.04;
    const resetBonus2 = greenLv > 0 ? (1 + greenLv * 0.15) * redMult : 1;
    const discFromReset = 1 / Math.max(1, resetBonus2);

    const cost = baseMult * base * Math.pow(growth, lv) * discFromPond * discFromTar * discFromMegaFish * discFromReset;
    return Math.max(1, Math.ceil(cost));
  };

  const getTarUpgradeCost = (index: number, lv: number, levels = state.tarLevels, fLevels = state.fisherooLevels, pLevels = state.pondLevels) => {
    const base = TAR_BASE_COSTS[index] ?? 0;
    const growth = TAR_GROWTH_RATES[index] ?? 1;

    const megaFishActive = (pLevels[11] ?? 0) >= 11 ? 1 : 0;
    const kingWormLv = levels[7] ?? 0;
    const discFromMegaFish = 1 / (1 + (megaFishActive * 0.05 * kingWormLv));

    const cost = (base * Math.pow(growth, lv)) * discFromMegaFish + lv;
    return Math.max(1, Math.ceil(cost));
  };

  const getFishGen = (pondLevels: PoppyLevels, tarLevels: PoppyLevels, fisheroos: number[], goGo: number, gambit: number) => {
    const basePerCatch = (10 * (pondLevels[0] ?? 0)) + (50 * (pondLevels[5] ?? 0)) + (200 * (pondLevels[10] ?? 0)) + (100 * (tarLevels[0] ?? 0)) + (1000 * (tarLevels[7] ?? 0));
    if (basePerCatch === 0) return 0;
    const catchReq = 30 / (1 + (pondLevels[1] ?? 0) * 0.05);
    const buddyLv = pondLevels[7] ?? 0;
    const megaFish5 = (pondLevels[11] ?? 0) >= 6 ? 1 : 0;
    const buddyMult = (1 + Math.min(5, buddyLv)) * Math.max(1, 1 + 0.5 * (buddyLv - 5) * megaFish5);
    const blueLv = fisheroos[0] ?? 0;
    const redMult = 1 + (fisheroos[3] ?? 0) * 0.04;
    const resetBonus0 = blueLv > 0 ? (1 + blueLv * 0.4) * redMult : 1;
    const frenzyMult = 1 + (tarLevels[2] ?? 0) * 0.08;
    const goGoMult = 1 + (goGo / 100);
    const shinyMult = shinyMults.value.reduce((acc, val) => acc * val, 1);
    const fishPerMin = basePerCatch * (60 / catchReq) * buddyMult * resetBonus0 * frenzyMult * goGoMult * gambit * shinyMult;

    return Math.floor(fishPerMin);
  };

  const getTarFishGen = (pondLevels: PoppyLevels, tarLevels: PoppyLevels) => {
    if ((pondLevels[11] ?? 0) < 1) return 0;

    let basePerHour = 2;
    const speedMult = 1 + ((tarLevels[4] ?? 0) * 0.2);
    const megaFishMult = ((pondLevels[11] ?? 0) >= 5 ? 3 : 1) * ((pondLevels[11] ?? 0) >= 8 ? 3 : 1);
    const mongoMult = 1 + ((tarLevels[6] ?? 0) * 0.15);

    const blackLv = state.fisherooLevels[4] ?? 0;
    const redMult = 1 + (state.fisherooLevels[3] ?? 0) * 0.04;
    const blackFisherooMult = blackLv > 0 ? (1 + blackLv * 0.2) * redMult : 1;

    return basePerHour * speedMult * megaFishMult * mongoMult * blackFisherooMult;
  };

  const target = computed(() => {
    const cost6 = getPondUpgradeCost(6, state.pondLevels[6] ?? 0);
    const cost11 = getPondUpgradeCost(11, state.pondLevels[11] ?? 0);

    if (state.targetMode === 'RESET') {
      return { name: "Fisheroo Reset", cost: cost6, index: 6 };
    } else if (state.targetMode === 'CATCH') {
      return { name: "Greatest Catch", cost: cost11, index: 11 };
    } else {
      if (cost11 <= cost6 && (state.pondLevels[11] ?? 0) < 12) {
        return { name: "Greatest Catch", cost: cost11, index: 11 };
      } else {
        return { name: "Fisheroo Reset", cost: cost6, index: 6 };
      }
    }
  });

  const timeToTarget = computed(() => {
    const gen = getFishGen(state.pondLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
    if (gen <= 0) return Infinity;
    return Math.max(0, (target.value.cost - state.currentFish) / gen) * 60;
  });

  const getFutureEfficientCost = (initialPondLevels: PoppyLevels, initialTarLevels: PoppyLevels) => {
    let totalPathCost = 0;
    const tempPondLevels = [...initialPondLevels];
    const tempTarLevels = [...initialTarLevels];

    const validIndices = [0, 1, 2, 3, 4, 5, 7, 8, 9];

    const cost6 = getPondUpgradeCost(6, tempPondLevels[6] ?? 0, tempPondLevels, tempTarLevels);
    const cost11 = getPondUpgradeCost(11, tempPondLevels[11] ?? 0, tempPondLevels, tempTarLevels);
    let targetIdx = 6;
    if (state.targetMode === 'CATCH') targetIdx = 11;
    else if (state.targetMode === 'RESET') targetIdx = 6;
    else targetIdx = (cost11 <= cost6 && (tempPondLevels[11] ?? 0) < 12) ? 11 : 6;

    for (let step = 0; step < 100; step++) {
      let bestStepIdx = -1;
      let maxStepEff = 0;

      const currentTargetCost = getPondUpgradeCost(targetIdx, tempPondLevels[targetIdx] ?? 0, tempPondLevels, tempTarLevels);
      const currentGen = getFishGen(tempPondLevels, tempTarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
      if (currentGen <= 0) break;

      for (const idx of validIndices) {
        const upgCost = getPondUpgradeCost(idx, tempPondLevels[idx] ?? 0, tempPondLevels, tempTarLevels);
        const simPondLevels = [...tempPondLevels];
        simPondLevels[idx] = (simPondLevels[idx] ?? 0) + 1;

        const nextGen = getFishGen(simPondLevels, tempTarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
        const nextTargetCost = getPondUpgradeCost(targetIdx, tempPondLevels[targetIdx] ?? 0, simPondLevels, tempTarLevels);

        const timeSaved = (currentTargetCost / currentGen) - (nextTargetCost / nextGen);
        const efficiency = timeSaved / upgCost;

        if (efficiency > maxStepEff) {
          maxStepEff = efficiency;
          bestStepIdx = idx;
        }
      }

      if (bestStepIdx !== -1 && maxStepEff > 0) {
        totalPathCost += getPondUpgradeCost(bestStepIdx, tempPondLevels[bestStepIdx] ?? 0, tempPondLevels, tempTarLevels);
        tempPondLevels[bestStepIdx] = (tempPondLevels[bestStepIdx] ?? 0) + 1;
      } else {
        break;
      }
    }
    return totalPathCost;
  };

  const pondUpgradeAnalysis = computed(() => {
    const rawGen = getFishGen(state.pondLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
    const targetIdx = target.value.index;

    const futureBurdenCost = getFutureEfficientCost(state.pondLevels, state.tarLevels);
    const currentTargetCost = target.value.cost;
    const currentTotalBurden = currentTargetCost + futureBurdenCost;
    const currentTimeToBurden = rawGen > 0 ? (currentTotalBurden - state.currentFish) / rawGen : Infinity;

    return POND_UPGRADE_NAMES.map((name, i) => {
      const buyCost = getPondUpgradeCost(i, state.pondLevels[i] ?? 0);
      const nextLevels = [...state.pondLevels];
      const cur = nextLevels[i] ?? 0;
      nextLevels[i] = cur + 1;

      const nextGen = getFishGen(nextLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
      const nextTargetCost = getPondUpgradeCost(targetIdx, nextLevels[targetIdx] ?? 0, nextLevels, state.tarLevels);
      const nextFutureBurdenCost = getFutureEfficientCost(nextLevels, state.tarLevels);

      const nextTotalBurden = nextTargetCost + nextFutureBurdenCost;
      const fishAfterBuy = state.currentFish - buyCost;
      const nextTimeToBurden = nextGen > 0 ? (nextTotalBurden - fishAfterBuy) / nextGen : Infinity;

      const timeSaved = (currentTimeToBurden - nextTimeToBurden) * 60;

      return {
        name,
        cost: buyCost,
        timeSaved,
        efficiency: (buyCost > 0 && timeSaved > 0) ? timeSaved / buyCost : 0,
        icon: `/poppy/pond-upg-${i + 1}.png`
      };
    });
  });

  const tarUpgradeAnalysis = computed(() => {
    const gen = getTarFishGen(state.pondLevels, state.tarLevels);
    const pondGen = getFishGen(state.pondLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
    const futureBurdenCost = getFutureEfficientCost(state.pondLevels, state.tarLevels);
    const currentTargetCost = target.value.cost;
    const currentTotalBurden = currentTargetCost + futureBurdenCost;
    const currentTimeToBurden = pondGen > 0 ? (currentTotalBurden - state.currentFish) / pondGen : Infinity;

    return TAR_UPGRADE_NAMES.map((name, i) => {
      const cost = getTarUpgradeCost(i, state.tarLevels[i] ?? 0, state.tarLevels, state.fisherooLevels, state.pondLevels);
      const nextLevels = [...state.tarLevels];
      const cur = nextLevels[i] ?? 0;
      nextLevels[i] = cur + 1;

      const nextTarGen = getTarFishGen(state.pondLevels, nextLevels);

      let efficiency = 0;
      let timeSaved = 0;

      if ([0, 2, 3, 7].includes(i)) {
        const nextPondGen = getFishGen(state.pondLevels, nextLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
        const nextTargetCostPond = getPondUpgradeCost(target.value.index, state.pondLevels[target.value.index] ?? 0, state.pondLevels, nextLevels, state.fisherooLevels);
        const nextFutureBurdenCost = getFutureEfficientCost(state.pondLevels, nextLevels);
        const nextTotalBurden = nextTargetCostPond + nextFutureBurdenCost;
        const nextTimeToBurden = nextPondGen > 0 ? (nextTotalBurden - (state.currentFish)) / nextPondGen : Infinity;

        timeSaved = (currentTimeToBurden - nextTimeToBurden) * 60;
        efficiency = (cost > 0 && timeSaved > 0) ? timeSaved / cost : 0;
      } else {
        efficiency = 0;
      }

      return {
        name,
        cost,
        timeSaved,
        efficiency,
        icon: `/poppy/tar-upg-${i + 1}.png`
      };
    });
  });

  const fisherooBonuses = computed(() => {
    const fmt = (num: number) => num.toFixed(2).replace(/\.?0+$/, '');
    const b0l = state.fisherooLevels[0] ?? 0;
    const b1l = state.fisherooLevels[1] ?? 0;
    const b2l = state.fisherooLevels[2] ?? 0;
    const b3l = state.fisherooLevels[3] ?? 0;
    const b4l = state.fisherooLevels[4] ?? 0;

    const rMult = 1 + b3l * 0.04;

    const b0 = b0l > 0 ? (1 + b0l * 0.4) * rMult : 1;
    const b1 = b1l > 0 ? (1 + b1l * 0.3) * rMult : 1;
    const b2 = b2l > 0 ? (1 + b2l * 0.15) * rMult : 1;
    const b3 = rMult;
    const b4 = b4l > 0 ? (1 + b4l * 0.2) * rMult : 1;

    return [
      { text: `${fmt(b0)}x bluefin fish caught` },
      { text: `${fmt(b1)}x shiny fishing speed and luck` },
      { text: `All upgrades are ${fmt(b2)}x cheaper` },
      { text: `Other Reset bonuses are ${fmt(b3)}x higher` },
      { text: `${fmt(b4)}x tartar fish caught` },
    ];
  });

  const shinyMults = computed(() => {
    return state.shinyMultipliers.map((mult, i) => Math.max(1, mult));
  });

  const totalShinyMult = computed(() => {
    return shinyMults.value.reduce((acc, val) => acc * val, 1);
  });

  return {
    state,
    POND_UPGRADE_NAMES,
    TAR_UPGRADE_NAMES,
    target,
    timeToTarget,
    totalShinyMult,
    pondGen: computed(() => getFishGen(state.pondLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus)),
    tarGen: computed(() => getTarFishGen(state.pondLevels, state.tarLevels)),
    pondUpgradeAnalysis,
    tarUpgradeAnalysis,
    fisherooBonuses,
    getPondUpgradeCost,
    getTarUpgradeCost
  };
};
