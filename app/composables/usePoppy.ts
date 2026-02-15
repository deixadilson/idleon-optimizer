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
  totalFisherooPoints: number;
  distributionMode: 'Custom' | 'Max bluefin gen' | 'max shiny fish and luck' | 'max cost reduction' | 'max tartar gen' | 'bluefin and tartar' | 'balanced gen';
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
  totalFisherooPoints: 0,
  distributionMode: 'Custom',
});

export const usePoppy = () => {
  const { formatNumber, formatTime } = useFormatters();
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



  const getPondUpgradeDescription = (index: number) => {
    const lv = state.pondLevels[index] ?? 0;
    switch (index) {
      case 0: return `Catch ${formatNumber(lv * 10)} Fish\nevery 30 seconds`;
      case 1: return `Bluefin fishing speed\nis ${(1 + lv * 0.05).toFixed(2).replace(/\.?0+$/, "")}x Faster`;
      case 2: return `Catch Shiny Fish\nat a rate of ${formatNumber(lv * 50)}% /hr`;
      case 3: return "Gain a permanent bonus\nin the real game!";
      case 4: return `All fish upgrades\nare ${((1 - 1 / (1 + lv * 0.1)) * 100).toFixed(1).replace(/\.?0+$/, "")}% cheaper`;
      case 5: return `Catch +${formatNumber(lv * 50)} more\nBluefin Fish each time`;
      case 6: return "Reset all upgrades and\nfish for bonuses!";
      case 7: return "Recruit a new Bluefin fisherman!";
      case 8: return `Shiny fishing speed\nis ${(1 + lv * 0.05).toFixed(2).replace(/\.?0+$/, "")}x faster`;
      case 9: return `Next Fisheroo Reset\ngives +${formatNumber(lv)} pts!`;
      case 10: return `Catch +${formatNumber(lv * 200)} more\nBluefin Fish each time`;
      case 11: return "Reset it all.\nGain a permanent Megafish";
      default: return "";
    }
  };

  const getTarUpgradeDescription = (index: number) => {
    const lv = state.tarLevels[index] ?? 0;
    switch (index) {
      case 0: return `Catch +${formatNumber(lv * 100)} more\nBluefin Fish each time`;
      case 1: return `+${((700 * lv) / (lv + 40)).toFixed(1).replace(/\.?0+$/, "")}% chance\nfor extra shiny catches`;
      case 2: return `Boosts the amount of\nBluefin Fish caught by +${lv * 8}%`;
      case 3: return `All fish upgrades\nare ${((1 - 1 / (1 + lv * 0.15)) * 100).toFixed(1).replace(/\.?0+$/, "")}% cheaper`;
      case 4: return `Catch Tartar Fish ${(1 + lv * 0.05).toFixed(2).replace(/\.?0+$/, "")}x faster`;
      case 5: return `Next Fisheroo Reset\ngives +${formatNumber(lv)} more pts to spend!`;
      case 6: return `Multipliers in Shiny Fishing\nshow up ${((30 * lv) / (lv + 40)).toFixed(1).replace(/\.?0+$/, "")}% more often!`;
      case 7: return `Catch +${formatNumber(lv * 1000)} more Bluefin Fish\nevery 100 seconds`;
      default: return "";
    }
  };

  const target = computed(() => {
    const cost6 = getPondUpgradeCost(6, state.pondLevels[6] ?? 0);
    const cost11 = getPondUpgradeCost(11, state.pondLevels[11] ?? 0);

    if (state.targetMode === 'RESET') {
      return { name: "Fisheroo Reset", cost: cost6, index: 6 };
    } else if (state.targetMode === 'CATCH') {
      return { name: "Greatest Catch", cost: cost11, index: 11 };
    } else {
      if (cost11 <= cost6) {
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

    const currentTargetCost = target.value.cost;
    const futureBurdenCost = state.currentFish >= currentTargetCost ? 0 : getFutureEfficientCost(state.pondLevels, state.tarLevels);
    const currentTotalBurden = currentTargetCost + futureBurdenCost;
    const currentTimeToBurden = rawGen > 0 ? (currentTotalBurden - state.currentFish) / rawGen : Infinity;

    const directPondIndices = [0, 1, 4, 5];
    let maxPondDirectEfficiency = 0;
    let avgPondDirectCost = 0;

    if (rawGen > 0 && isFinite(currentTimeToBurden)) {
      let totalPondCost = 0;
      let count = 0;
      directPondIndices.forEach(idx => {
        const lv = state.pondLevels[idx] ?? 0;
        const bCost = getPondUpgradeCost(idx, lv);

        const nLvs = [...state.pondLevels];
        nLvs[idx] = lv + 1;
        const nGen = getFishGen(nLvs, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
        const nTgtCost = getPondUpgradeCost(targetIdx, nLvs[targetIdx] ?? 0, nLvs, state.tarLevels);
        const fAfter = state.currentFish - bCost;
        const nFutBurden = fAfter >= nTgtCost ? 0 : getFutureEfficientCost(nLvs, state.tarLevels);
        const nTotBurden = nTgtCost + nFutBurden;
        const nTimeToBurden = nGen > 0 ? (nTotBurden - fAfter) / nGen : Infinity;
        const tSaved = isFinite(currentTimeToBurden) ? (currentTimeToBurden - nTimeToBurden) * 60 : 0;
        const eff = (bCost > 0) ? tSaved / bCost : 0;
        if (eff > maxPondDirectEfficiency) maxPondDirectEfficiency = eff;

        if (lv > 0) {
          totalPondCost += bCost;
          count++;
        }
      });
      avgPondDirectCost = count > 0 ? totalPondCost / count : 0;
    }

    return POND_UPGRADE_NAMES.map((name, i) => {
      const buyCost = getPondUpgradeCost(i, state.pondLevels[i] ?? 0);
      let timeSaved = 0;
      let efficiency = 0;

      if (i === 2 || i === 8) {
        const weight = 0.30;
        timeSaved = maxPondDirectEfficiency * (avgPondDirectCost * weight);
        efficiency = buyCost > 0 ? timeSaved / buyCost : 0;
      } else {
        const nextLevels = [...state.pondLevels];
        const cur = nextLevels[i] ?? 0;
        nextLevels[i] = cur + 1;

        const nextGen = getFishGen(nextLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
        const nextTargetCost = getPondUpgradeCost(targetIdx, nextLevels[targetIdx] ?? 0, nextLevels, state.tarLevels);

        const fishAfterBuy = state.currentFish - buyCost;
        const nextFutureBurdenCost = fishAfterBuy >= nextTargetCost ? 0 : getFutureEfficientCost(nextLevels, state.tarLevels);

        const nextTotalBurden = nextTargetCost + nextFutureBurdenCost;
        const nextTimeToBurden = nextGen > 0 ? (nextTotalBurden - fishAfterBuy) / nextGen : Infinity;

        if (isFinite(currentTimeToBurden)) {
          timeSaved = (currentTimeToBurden - nextTimeToBurden) * 60;
        } else if (isFinite(nextTimeToBurden)) {
          timeSaved = Infinity;
        }
        efficiency = (buyCost > 0 && timeSaved > 0) ? timeSaved / buyCost : 0;
      }

      return {
        name,
        cost: buyCost,
        description: getPondUpgradeDescription(i),
        timeSaved,
        efficiency,
        icon: `/poppy/pond-upg-${i + 1}.png`
      };
    });
  });

  const tarUpgradeAnalysis = computed(() => {
    const bluefinGen = getFishGen(state.pondLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
    const currentBluefinTargetTime = bluefinGen > 0 ? (target.value.cost - state.currentFish) / bluefinGen : Infinity;
    const HORIZON = 1440;
    const directIndices = [0, 2, 3, 7];

    let avgDirectEfficiency = 0;
    let maxDirectEfficiency = 0;
    let avgDirectCost = 0;

    if (bluefinGen > 0 && isFinite(currentBluefinTargetTime)) {
      let totalEff = 0;
      let totalCost = 0;
      directIndices.forEach(idx => {
        const upgCost = getTarUpgradeCost(idx, state.tarLevels[idx] ?? 0, state.tarLevels, state.fisherooLevels, state.pondLevels);
        const nLvs = [...state.tarLevels];
        nLvs[idx] = (nLvs[idx] ?? 0) + 1;
        const nPondGen = getFishGen(state.pondLevels, nLvs, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
        const nTgtCost = getPondUpgradeCost(target.value.index, state.pondLevels[target.value.index] ?? 0, state.pondLevels, nLvs, state.fisherooLevels);
        const nBlueTgtTime = nPondGen > 0 ? (nTgtCost - state.currentFish) / nPondGen : Infinity;

        const tSaved = isFinite(currentBluefinTargetTime) ? (currentBluefinTargetTime - nBlueTgtTime) * 60 : 0;
        const eff = (upgCost > 0) ? tSaved / upgCost : 0;

        totalEff += eff;
        totalCost += upgCost;
        if (eff > maxDirectEfficiency) maxDirectEfficiency = eff;
      });
      avgDirectEfficiency = totalEff / directIndices.length;
      avgDirectCost = totalCost / directIndices.length;
    }

    return TAR_UPGRADE_NAMES.map((name, i) => {
      const cost = getTarUpgradeCost(i, state.tarLevels[i] ?? 0, state.tarLevels, state.fisherooLevels, state.pondLevels);

      let efficiency = 0;
      let timeSaved = 0;

      if (bluefinGen > 0) {
        if (directIndices.includes(i)) {
          const nextLevels = [...state.tarLevels];
          nextLevels[i] = (nextLevels[i] ?? 0) + 1;

          const nextPondGen = getFishGen(state.pondLevels, nextLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus);
          const nextTargetCostPond = getPondUpgradeCost(target.value.index, state.pondLevels[target.value.index] ?? 0, state.pondLevels, nextLevels, state.fisherooLevels);

          const nextBluefinTargetTime = nextPondGen > 0 ? (nextTargetCostPond - state.currentFish) / nextPondGen : Infinity;

          timeSaved = isFinite(currentBluefinTargetTime) ? (currentBluefinTargetTime - nextBluefinTargetTime) * 60 : 0;
          efficiency = (cost > 0 && timeSaved > 0) ? timeSaved / cost : 0;
        } else if (i === 1 || i === 6) {
          // Tar Pit Shiny Upgrades (Bargain at 20% of market average)
          const currentLv = state.tarLevels[i] ?? 0;
          const capLvl = i === 1 ? 72 : 93;

          if (currentLv < capLvl && maxDirectEfficiency > 0) {
            const weight = 0.20;
            timeSaved = maxDirectEfficiency * (avgDirectCost * weight);
            efficiency = cost > 0 ? timeSaved / cost : 0;
          }
        } else if (i === 4) {
          const currentLv = state.tarLevels[4] ?? 0;

          if (avgDirectCost > 0 && cost < avgDirectCost) {
            efficiency = maxDirectEfficiency * (avgDirectCost / cost);
            timeSaved = efficiency * cost;
          } else {
            const currentTarGen = tarGen.value;
            const redBonus = 1 + (state.fisherooLevels[3] ?? 0) * 0.04;
            const blackBonus = 1 + (state.fisherooLevels[4] ?? 0) * 0.2;
            const totalBlackBonus = blackBonus * redBonus;
            const mfStatus = state.pondLevels[11] ?? 0;
            const mf5Factor = mfStatus >= 5 ? 3 : 1;
            const mf8Factor = mfStatus >= 8 ? 3 : 1;
            const nextTarGen = 2 * (1 + 0.05 * (currentLv + 1)) * totalBlackBonus * mf5Factor * mf8Factor;

            const deltaGen = (nextTarGen - currentTarGen) / 60;
            if (deltaGen > 0 && avgDirectEfficiency > 0) {
              const roiFactor = Math.min(2.0, Math.max(0.1, avgDirectCost / cost));
              timeSaved = deltaGen * HORIZON * avgDirectEfficiency * roiFactor;
              efficiency = cost > 0 ? timeSaved / cost : 0;
            }
          }
        }
      } else if (bluefinGen === 0 && i === 0) {
        efficiency = 0.000001;
        timeSaved = Infinity;
      }

      return {
        name,
        cost,
        description: getTarUpgradeDescription(i),
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

  const SLOPES = [0.4, 0.3, 0.15, 0.04, 0.2];

  const pointsToGain = computed(() => {
    const nautilusBonus = (state.pondLevels[11] ?? 0) >= 3 ? 5 : 0;
    return (state.pondLevels[9] ?? 0) + (state.tarLevels[5] ?? 0) + 10 + nautilusBonus;
  });

  let isDistributing = false;
  const applyDistribution = () => {
    if (state.distributionMode === 'Custom') return;

    const total = state.totalFisherooPoints;

    let bestRedLv = 0;
    let maxRedScore = -1;
    for (let r = 0; r <= total; r++) {
      const score = (1 + (total - r) * 0.4) * (1 + r * 0.04);
      if (score > maxRedScore) {
        maxRedScore = score;
        bestRedLv = r;
      }
    }

    const remainder = total - bestRedLv;
    const nextLevels = [0, 0, 0, 0, 0];
    nextLevels[3] = bestRedLv;

    let targets: number[] = [];
    if (state.distributionMode === 'Max bluefin gen') targets = [0];
    else if (state.distributionMode === 'max shiny fish and luck') targets = [1];
    else if (state.distributionMode === 'max cost reduction') targets = [2];
    else if (state.distributionMode === 'max tartar gen') targets = [4];
    else if (state.distributionMode === 'bluefin and tartar') targets = [0, 4];
    else if (state.distributionMode === 'balanced gen') targets = [0, 1, 4];

    if (targets.length === 0) return;

    const perTarget = Math.floor(remainder / targets.length);
    let extra = remainder % targets.length;

    for (const idx of targets) {
      nextLevels[idx] = perTarget + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
    }

    isDistributing = true;
    state.fisherooLevels = nextLevels;
    setTimeout(() => { isDistributing = false; }, 0);
  };

  const tarGen = computed(() => {
    const superTarbaitLv = state.tarLevels[4] ?? 0;
    const redBonus = 1 + (state.fisherooLevels[3] ?? 0) * 0.04;
    const blackBonus = 1 + (state.fisherooLevels[4] ?? 0) * 0.2;
    const totalBlackBonus = blackBonus * redBonus;

    const mfStatus = state.pondLevels[11] ?? 0;
    const mf5Factor = mfStatus >= 5 ? 3 : 1;
    const mf8Factor = mfStatus >= 8 ? 3 : 1;

    return 2 * (1 + 0.05 * superTarbaitLv) * totalBlackBonus * mf5Factor * mf8Factor;
  });

  watch(() => state.distributionMode, (newMode) => {
    if (newMode !== 'Custom') applyDistribution();
  });

  watch(() => state.totalFisherooPoints, () => {
    if (state.distributionMode !== 'Custom') applyDistribution();
  });

  watch(() => state.fisherooLevels, () => {
    if (isDistributing) return;

    if (state.distributionMode !== 'Custom') {
      state.distributionMode = 'Custom';
    }
  }, { deep: true });

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
    pointsToGain,
    pondGen: computed(() => getFishGen(state.pondLevels, state.tarLevels, state.fisherooLevels, state.goGoSecretKangaroo, state.gambitBonus)),
    tarGen,
    pondUpgradeAnalysis,
    tarUpgradeAnalysis,
    fisherooBonuses,
    getPondUpgradeCost,
    getTarUpgradeCost
  };
};
