export type BubbaLevels = number[];

const state = reactive({
  levels: Array(28).fill(0) as BubbaLevels,
  mindfulOffsets: Array(28).fill(0) as BubbaLevels,
  charismaLvs: [0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number],
  emulsifiedIndices: [] as number[],
  selectedGifts: [-1, -1],
  diceValues: [0, 0, 0, 0, 0, 0, 0, 0] as number[],
  smokerValues: [0, 0, 0, 0, 0] as number[],
  coinValues: [0, 0, 0, 0] as [number, number, number, number],
  currentMeat: 0,
  activePats: 0,
  patsPerHour: 0,
  poppyFishPower: 0,
  megaPushConfig: {
    patsUsed: 0,
    giftsUsed: 0,
    clicksPerSecond: 8,
    mouseSpeed: 'medium' as 'slow' | 'medium' | 'fast' | 'instant',
    emulsifyJoyBefore: false,
    emulsifyHustleAfter: false,
    emulsifyRizzAfter: false,
  }
});

export const useBubba = () => {
  const FACTORS = [1.07, 1.3, 1.07, 10, 1.12, 1.5, 1.1, 1.1, 125, 3000, 3, 1.1, 25, 1.8, 75000, 1.2, 1000, 1.6, 1.23, 1.12, 1.5, 1.8, 1.3, 1.22, 1.75, 1.12, 1.3, 1.5];
  const MULTI = [1, 1, 0.6, 1, 1, 1.3, 1, 1, 1.6, 0.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const MINDFUL_RESTRICTED = [3, 8, 9, 10, 12, 14, 15, 16];

  const diceStats = computed(() => {
    const isSooshi = (state.levels[8] ?? 0) >= 5;
    const count = Math.min(8, 1 + (isSooshi ? 1 : 0) + (state.levels[14] ?? 0));
    const sides = 6 + (isSooshi ? 5 : 0) + (state.levels[16] ?? 0);
    return { count, sides };
  });

  const diceMulti = computed(() => {
    const { count } = diceStats.value;
    let product = 1;
    let hasActiveDice = false;

    for (let i = 0; i < count; i++) {
      const val = state.diceValues[i] || 0;
      if (val > 0) {
        const scaledVal = val <= 6 ? val : 6 + (val - 6) * 0.4;
        product *= scaledVal;
        hasActiveDice = true;
      }
    }

    if (!hasActiveDice) return 1;
    return 1 + (product / 100);
  });

  const charismaBonuses = computed(() => {
    const lvs = state.charismaLvs;
    const superChartLv = state.levels[13] ?? 0;
    const superChartBonus = 1 + (superChartLv * 0.01);
    const isMF6 = (state.levels[8] ?? 0) >= 6;
    const getEmulsifyFact = (idx: number) => (isMF6 && state.emulsifiedIndices.includes(idx)) ? 3 : 1;
    return {
      hustle: (lvs[0] ?? 0) * 0.1 * superChartBonus * getEmulsifyFact(0) + 1,
      rizz: 1 - 1 / (1 + 0.02 * (lvs[1] ?? 0) * superChartBonus * getEmulsifyFact(1)),
      joy: 1 + ((lvs[2] ?? 0) * 0.05 * superChartBonus * getEmulsifyFact(2)),
      courage: (lvs[3] ?? 0) * superChartBonus * getEmulsifyFact(3),
      mindful: 0.1 * (lvs[4] ?? 0) * superChartBonus * getEmulsifyFact(4),
      savvy: (lvs[5] ?? 0) * superChartBonus * getEmulsifyFact(5)
    };
  });

  const smokerMulti = computed(() => {
    const rates = [0.02, 0.03, 0.04, 0.06, 0.10];
    return state.smokerValues.reduce((acc, val, i) => acc * (1 + (val ?? 0) * (rates[i] ?? 0)), 1);
  });

  const spareCoinsMulti = computed(() => {
    const [c1, c2, c3, c4] = state.coinValues;
    return 1 + (c1 + 5 * c2 + 25 * c3 + 100 * c4) / 100;
  });

  const maxPats = computed(() => {
    const lv = state.levels[1] ?? 0;
    if (lv <= 1) return 1 * 2;
    if (lv === 2) return 3 * 2;
    const baseline = Math.floor(Math.log2(lv - 1)) + 4;
    return baseline * 2;
  });

  const meatPerPat = computed(() => {
    const joyMulti = charismaBonuses.value.joy;
    const giftHappyMult = state.selectedGifts.includes(1) ? 1.5 : 1;
    const hPerPat = (state.levels[1] ?? 0) * joyMulti * giftHappyMult;
    if (hPerPat <= 0) return 0;

    const peakBoost = getHMultFromHappiness(hPerPat) - 1;
    const effectiveSeconds = peakBoost * Math.sqrt(hPerPat) * 1.1;
    const baseMeatPerSec = getMeatGen(state.levels, 1) / 60;

    return baseMeatPerSec * effectiveSeconds;
  });

  const twoHourSkip = computed(() => {
    return (getMeatGen(state.levels, 1) / 60) * 120 * 60;
  });

  const getDecayRate = (h: number) => {
    const m = getHMultFromHappiness(h);
    return m * (1 + (m - 1) / 45);
  };

  const calculateOptimalGifts = (startH: number, cps: number, baseMeatRate: number, currentLevels: BubbaLevels, currentOffsets: BubbaLevels) => {
    let optH = startH;
    let optimalGifts = 0;
    let optLevels = [...currentLevels];
    let simUpgradeIdx = 10;

    const clickDuration = 1 / cps;

    while (true) {
      const cost = getUpgradeCost(simUpgradeIdx, optLevels[simUpgradeIdx] ?? 0, currentOffsets[simUpgradeIdx] ?? 0, optLevels);
      const hMult = getHMultFromHappiness(optH);
      const yieldVal = 20 * baseMeatRate * hMult;
      if (cost > yieldVal) break;

      optimalGifts++;
      optLevels[simUpgradeIdx] = (optLevels[simUpgradeIdx] ?? 0) + 1;
      const decayStep = getDecayRate(optH) * clickDuration;
      optH = Math.max(0, optH - decayStep);

      if (optimalGifts > 1000) break;
    }
    return optimalGifts;
  };

  const openGiftMegaPush = computed(() => {
    const isMF6 = (state.levels[8] ?? 0) >= 6;
    const getSimulatedCharisma = (overrideEmulsified: number[]) => {
      const lvs = state.charismaLvs;
      const superChartLv = state.levels[13] ?? 0;
      const superChartBonus = 1 + (superChartLv * 0.01);
      const getEmulsifyFact = (idx: number) => (isMF6 && overrideEmulsified.includes(idx)) ? 3 : 1;
      return {
        hustle: (lvs[0] ?? 0) * 0.1 * superChartBonus * getEmulsifyFact(0) + 1,
        joy: 1 + ((lvs[2] ?? 0) * 0.05 * superChartBonus * getEmulsifyFact(2)),
      };
    };

    const pats = maxPats.value;
    const cps = 8;

    let phase1Emulsified = [2];
    const charBonusP1 = getSimulatedCharisma(phase1Emulsified);
    const joyFactor = state.selectedGifts.includes(1) ? 1.5 : 1;
    const hPerPat = (state.levels[1] ?? 0) * charBonusP1.joy * joyFactor;

    let currentH = 0;
    const simulatePats = () => {
      for (let i = 0; i < pats; i++) {
        currentH += hPerPat;
        const decayStep = getDecayRate(currentH) * (1 / cps);
        currentH = Math.max(0, currentH - decayStep);
      }
    };
    simulatePats();

    let phase2Emulsified = [...phase1Emulsified];

    const charBonusP3 = getSimulatedCharisma(phase2Emulsified);
    const baseSlices = ((state.levels[0] ?? 0) * 1) + ((state.levels[7] ?? 0) * 6) + ((state.levels[23] ?? 0) * 50);
    const D84 = ((state.levels[2] ?? 0) * 2) + (8 * (state.levels[11] ?? 0)) + ((state.levels[19] ?? 0) * 25) + 100;
    const totalLv = state.levels.reduce((a, b) => a + b, 0);
    const mf1Mult = (state.levels[8] ?? 0) >= 1 ? 1 + (totalLv / 100) : 1;
    const poppyMult = 1 + ((state.levels[24] ?? 0) * 0.05 * state.poppyFishPower);
    const coinsMult = spareCoinsMulti.value * (1 + (state.levels[21] ?? 0) / 100);
    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + ((state.levels[17] ?? 0) / 100)) : 1;
    const baseMeatRate = baseSlices * 60 * (D84 / 100) * mf1Mult * diceMulti.value * smokerMulti.value * charBonusP3.hustle * coinsMult * poppyMult * beegSliceMult;

    const optimalCount = calculateOptimalGifts(currentH, cps, baseMeatRate, state.levels, state.mindfulOffsets);

    let totalYield = 0;
    let simH = currentH;

    const moveTime = 0.5;
    const stepSize = 0.1;

    let t = 0;
    while (t < moveTime) {
      const dt = Math.min(stepSize, moveTime - t);
      const decayStep = getDecayRate(simH) * dt;
      simH = Math.max(0, simH - decayStep);
      t += dt;
    }

    for (let i = 0; i < optimalCount; i++) {
      const hMult = getHMultFromHappiness(simH);
      totalYield += 20 * baseMeatRate * hMult;
      const decayStep = getDecayRate(simH) * (1 / cps);
      simH = Math.max(0, simH - decayStep);
    }

    return { count: optimalCount, yield: totalYield };
  });

  const megaPushSimulation = computed(() => {
    const config = state.megaPushConfig;
    const joyFactor = state.selectedGifts.includes(1) ? 1.5 : 1;

    const isMF6 = (state.levels[8] ?? 0) >= 6;

    const getSimulatedCharisma = (overrideEmulsified: number[]) => {
      const lvs = state.charismaLvs;
      const superChartLv = state.levels[13] ?? 0;
      const superChartBonus = 1 + (superChartLv * 0.01);
      const getEmulsifyFact = (idx: number) => (isMF6 && overrideEmulsified.includes(idx)) ? 3 : 1;
      return {
        hustle: (lvs[0] ?? 0) * 0.1 * superChartBonus * getEmulsifyFact(0) + 1,
        joy: 1 + ((lvs[2] ?? 0) * 0.05 * superChartBonus * getEmulsifyFact(2)),
      };
    };

    let phase1Emulsified = [...state.emulsifiedIndices];
    if (config.emulsifyJoyBefore && !phase1Emulsified.includes(2)) phase1Emulsified.push(2);
    if (!config.emulsifyJoyBefore && phase1Emulsified.includes(2)) phase1Emulsified = phase1Emulsified.filter(i => i !== 2);

    const charBonusP1 = getSimulatedCharisma(phase1Emulsified);
    const hPerPat = (state.levels[1] ?? 0) * charBonusP1.joy * joyFactor;

    const cps = config.clicksPerSecond || 7;
    const moveTimes: Record<string, number> = { 'slow': 1.0, 'medium': 0.5, 'fast': 0.2, 'instant': 0 };
    const moveTime = moveTimes[config.mouseSpeed] ?? 0.5;

    let currentH = 0;
    let maxPatsLimit = maxPats.value;
    let maxHReached = 0;

    const batch1Count = Math.max(0, config.patsUsed - maxPatsLimit);
    const batch2Count = Math.min(config.patsUsed, maxPatsLimit);

    const simulatePats = (count: number) => {
      for (let i = 0; i < count; i++) {
        currentH += hPerPat;
        const decayStep = getDecayRate(currentH) * (1 / cps);
        currentH = Math.max(0, currentH - decayStep);
        if (currentH > maxHReached) maxHReached = currentH;
      }
    };

    const simulateDecay = (duration: number) => {
      const stepSize = 0.1;
      let t = 0;
      while (t < duration) {
        const dt = Math.min(stepSize, duration - t);
        const decayStep = getDecayRate(currentH) * dt;
        currentH = Math.max(0, currentH - decayStep);
        t += dt;
      }
    };

    simulatePats(batch1Count);

    if (batch1Count > 0 && batch2Count > 0) {
      simulateDecay(moveTime);
    }

    simulatePats(batch2Count);

    let phase2Emulsified = [...phase1Emulsified];
    let timeSpentSwitching = 0;

    if (config.emulsifyHustleAfter) {
      if (!phase2Emulsified.includes(0)) {
        timeSpentSwitching += moveTime * 2 + (2 / cps);
        phase2Emulsified.push(0);
      }
    } else {
      if (phase2Emulsified.includes(0)) {
        timeSpentSwitching += moveTime * 2 + (2 / cps);
        phase2Emulsified = phase2Emulsified.filter(i => i !== 0);
      }
    }

    if (config.emulsifyRizzAfter) {
      if (!phase2Emulsified.includes(1)) {
        timeSpentSwitching += moveTime * 2 + (2 / cps);
        phase2Emulsified.push(1);
      }
    } else {
      if (phase2Emulsified.includes(1)) {
        timeSpentSwitching += moveTime * 2 + (2 / cps);
        phase2Emulsified = phase2Emulsified.filter(i => i !== 1);
      }
    }

    if (timeSpentSwitching > 0) {
      const stepSize = 0.1;
      let t = 0;
      while (t < timeSpentSwitching) {
        const dt = Math.min(stepSize, timeSpentSwitching - t);
        const decayStep = getDecayRate(currentH) * dt;
        currentH = Math.max(0, currentH - decayStep);
        t += dt;
      }
    }

    const charBonusP3 = getSimulatedCharisma(phase2Emulsified);

    const baseSlices = ((state.levels[0] ?? 0) * 1) + ((state.levels[7] ?? 0) * 6) + ((state.levels[23] ?? 0) * 50);
    const D84 = ((state.levels[2] ?? 0) * 2) + (8 * (state.levels[11] ?? 0)) + ((state.levels[19] ?? 0) * 25) + 100;
    const totalLv = state.levels.reduce((a, b) => a + b, 0);
    const mf1Mult = (state.levels[8] ?? 0) >= 1 ? 1 + (totalLv / 100) : 1;
    const poppyMult = 1 + ((state.levels[24] ?? 0) * 0.05 * state.poppyFishPower);
    const coinsMult = spareCoinsMulti.value * (1 + (state.levels[21] ?? 0) / 100);
    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + ((state.levels[17] ?? 0) / 100)) : 1;

    const baseMeatRate = baseSlices * 60 * (D84 / 100) * mf1Mult * diceMulti.value * smokerMulti.value * charBonusP3.hustle * coinsMult * poppyMult * beegSliceMult;

    let totalYield = 0;
    const giftsToOpen = config.giftsUsed;
    let simH = currentH;

    for (let i = 0; i < giftsToOpen; i++) {
      if (i === 0) {
        const startDelay = moveTime;
        const stepSize = 0.1;
        let t = 0;
        while (t < startDelay) {
          const dt = Math.min(stepSize, startDelay - t);
          const decayStep = getDecayRate(simH) * dt;
          simH = Math.max(0, simH - decayStep);
          t += dt;
        }
      }

      const hMult = getHMultFromHappiness(simH);
      totalYield += 20 * baseMeatRate * hMult;

      const clickDuration = 1 / cps;
      const decayStep = getDecayRate(simH) * clickDuration;
      simH = Math.max(0, simH - decayStep);
    }

    let optH = currentH;
    let optimalGifts = 0;
    let optLevels = [...state.levels];
    let simUpgradeIdx = 10;

    const startDelay = moveTime;
    const stepSize = 0.1;
    let t = 0;
    while (t < startDelay) {
      const dt = Math.min(stepSize, startDelay - t);
      const decayStep = getDecayRate(optH) * dt;
      optH = Math.max(0, optH - decayStep);
      t += dt;
    }

    while (true) {
      const cost = getUpgradeCost(simUpgradeIdx, optLevels[simUpgradeIdx] ?? 0, state.mindfulOffsets[simUpgradeIdx] ?? 0, optLevels);
      const hMult = getHMultFromHappiness(optH);
      const yieldVal = 20 * baseMeatRate * hMult;

      if (cost > yieldVal) break;

      optimalGifts++;
      optLevels[simUpgradeIdx] = (optLevels[simUpgradeIdx] ?? 0) + 1;

      const clickDuration = 1 / cps;
      const decayStep = getDecayRate(optH) * clickDuration;
      optH = Math.max(0, optH - decayStep);

      if (optimalGifts > 1000) break;
    }

    return {
      totalYield,
      startSuggestion: (batch1Count > 0) ? (batch1Count / cps) : 0,
      maxHMult: getHMultFromHappiness(maxHReached),
      optimalGifts
    };
  });

  const getCostReduction = (levels: BubbaLevels) => {
    const rizz = charismaBonuses.value.rizz;
    const bargainDisc = 1 - 1 / (1 + 0.01 * (levels[4] ?? 0));
    const costSaverDisc = 1 - 1 / (1 + 0.02 * (levels[18] ?? 0));
    const permaSaleDisc = 1 - 1 / (1 + 0.04 * (levels[26] ?? 0));
    return (1 - rizz) * (1 - bargainDisc) * (1 - costSaverDisc) * (1 - permaSaleDisc);
  };

  const getUpgradeCost = (index: number, lv: number, offset: number, prodLevels: BubbaLevels) => {
    const reduction = getCostReduction(prodLevels);
    const costLv = Math.max(0, lv - offset);
    const term1 = Math.pow(index + 1, 2) * costLv;
    const term2 = Math.pow(2.4 + index / 3.65, index) * Math.pow(FACTORS[index] ?? 1, costLv);
    return Math.round(reduction * (term1 + term2) * (MULTI[index] ?? 1));
  };

  const getHMultFromHappiness = (h: number) => {
    if (h <= 1) return 1;
    return 1 + 0.1 * (Math.log2(h) + 25 * Math.log10(h) + Math.pow(h, 0.75));
  };

  const getMeatGen = (levels: BubbaLevels, hMult: number) => {
    const baseSlices = ((levels[0] ?? 0) * 1) + ((levels[7] ?? 0) * 6) + ((levels[23] ?? 0) * 50);
    if (baseSlices === 0) return 0;
    const D84 = ((levels[2] ?? 0) * 2) + (8 * (levels[11] ?? 0)) + ((levels[19] ?? 0) * 25) + 100;
    const totalLv = levels.reduce((a, b) => a + b, 0);
    const mf1Mult = (levels[8] ?? 0) >= 1 ? 1 + (totalLv / 100) : 1;
    const poppyMult = 1 + ((levels[24] ?? 0) * 0.05 * state.poppyFishPower);
    const coinsMult = spareCoinsMulti.value * (1 + (levels[21] ?? 0) / 100);
    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + ((levels[17] ?? 0) / 100)) : 1;

    return baseSlices * 60 * (D84 / 100) * mf1Mult * diceMulti.value * smokerMulti.value * charismaBonuses.value.hustle * coinsMult * poppyMult * beegSliceMult * hMult;
  };

  const getProgressReq = (n: number) => {
    return 50 * Math.pow(2.8 + n / 3.55, n - Math.min(1, Math.floor(n / 4)));
  };

  const upgradeAnalysis = computed(() => {
    const joyMulti = charismaBonuses.value.joy;
    const giftHappyMult = state.selectedGifts.includes(1) ? 1.5 : 1;
    const currentHMult = getHMultFromHappiness(state.activePats * (state.levels[1] ?? 0) * joyMulti * giftHappyMult);

    const getAvgHMult = (lv: number) => {
      const hPerPat = lv * joyMulti * giftHappyMult;
      if (hPerPat <= 0) return 1;
      const peakBoost = getHMultFromHappiness(hPerPat) - 1;
      const effectiveSeconds = peakBoost * Math.sqrt(hPerPat) * 1.2;
      return 1 + (state.patsPerHour * effectiveSeconds / 3600);
    };

    const targetIdx = 8;
    const targetCost = getUpgradeCost(targetIdx, state.levels[targetIdx] ?? 0, state.mindfulOffsets[targetIdx] ?? 0, state.levels);

    const genCurrent = getMeatGen(state.levels, currentHMult);
    const currentTimeToTarget = genCurrent > 0 ? (targetCost - state.currentMeat) / (genCurrent / 60) : Infinity;

    return state.levels.map((_, i) => {
      const lv = state.levels[i] ?? 0;
      const cost = getUpgradeCost(i, lv, state.mindfulOffsets[i] ?? 0, state.levels);

      if (lv === 0 && i > 0) {
        const req = getProgressReq(i);
        if (req / (genCurrent || 1) > 24) {
          return { cost, timeSaved: 0, efficiency: 0, icon: `/bubba/upg-${i}.png`, name: ["1st Slice", "Happi Boi", "Good Meat", "Bubba Boon", "Bargain", "Buyer Grin", "Charisma", "2nd Slice", "Megaflesh", "Fun Gifts", "Open Gift", "Great Meat", "Dice Roll", "Super Chart", "More Dice", "Smoker", "More Sides", "Uber Gifts", "Cost Saver", "Best Meat", "Real Love", "Spare Coins", "Loaded Dice", "3rd Slice", "Crossover", "2X Smoke", "Perma Sale", "Big Ol Coin"][i] };
        }
      }

      const nextLevels = [...state.levels];
      const currentNextLv = nextLevels[i];
      if (currentNextLv !== undefined) nextLevels[i] = currentNextLv + 1;

      const isHappiBoi = (i === 1);
      const baselineGen = isHappiBoi ? getMeatGen(state.levels, getAvgHMult(state.levels[1] ?? 0)) : genCurrent;
      const nGen = isHappiBoi ? getMeatGen(nextLevels, getAvgHMult(nextLevels[1] ?? 0)) : getMeatGen(nextLevels, currentHMult);

      const nTarget = getUpgradeCost(targetIdx, state.levels[targetIdx] ?? 0, state.mindfulOffsets[targetIdx] ?? 0, nextLevels);

      const baselineTimeToTarget = baselineGen > 0 ? (targetCost - state.currentMeat) / (baselineGen / 60) : Infinity;
      const nTimeToTarget = nGen > 0 ? (nTarget - (state.currentMeat - cost)) / (nGen / 60) : Infinity;

      let timeSaved = baselineTimeToTarget - nTimeToTarget;

      if (i === 5) {
        const b = (state.levels[0] || 0) + (state.levels[7] || 0) * 6 + (state.levels[23] || 0) * 50;
        timeSaved = isFinite(currentTimeToTarget) ? (0.1 * currentTimeToTarget / (b + 1)) : 0;
      }

      if (i === 10 && state.selectedGifts.includes(0)) {
        timeSaved += 1200;
      }

      let efficiency = cost > 0 ? timeSaved / cost : 0;

      if (i === 6) {
        const charLv = state.levels[i] ?? 0;
        const b = (state.levels[0] || 0) + (state.levels[7] || 0) * 6 + (state.levels[23] || 0) * 50;

        if (b === 0) {
          timeSaved = 0;
          efficiency = 0;
        } else {
          const totalCharismaLvs = state.charismaLvs.reduce((a, b) => a + (b ?? 0), 0);

          const joyWeight = state.patsPerHour / 5;
          const totalAccountLevels = state.levels.reduce((a, b) => a + b, 0);
          const mindfulWeight = 2.0 * Math.max(0.1, 1 - (totalAccountLevels / 2300));
          const isMF6 = (state.levels[8] ?? 0) >= 6;
          const getEmulsifyDivisor = (idx: number) => (isMF6 && state.emulsifiedIndices.includes(idx)) ? 3 : 1;
          const weights = [
            1.0 / getEmulsifyDivisor(0),
            1.2 / getEmulsifyDivisor(1),
            0.8 * joyWeight,
            0,
            1.5 * mindfulWeight,
            0
          ];

          const usefulIndices = [0, 1, 2, 4]; // Hustle, Rizz, Joy, Mindful
          const remLevels = usefulIndices.reduce((acc, idx) => acc + Math.max(0, 120 - (state.charismaLvs[idx] ?? 0)), 0);

          const activeWeightSum = usefulIndices.reduce((acc, idx) => acc + (weights[idx] ?? 0), 0);
          const avgWeight = activeWeightSum / usefulIndices.length;

          let weightedDistance = 0;
          for (let k = 0; k < remLevels; k++) {
            const currentLv = totalCharismaLvs + k;
            const cost = 20 * (1 + currentLv / 20) * Math.pow(1.03, currentLv);
            weightedDistance += cost * avgWeight;
          }

          const numbahsActive = state.selectedGifts.includes(2);
          const numbahsMult = numbahsActive ? 2.5 : 1;
          const currentSpeed = (1 + 0.05 * charLv) * numbahsMult;
          const nextSpeed = (1 + 0.05 * (charLv + 1)) * numbahsMult;

          timeSaved = weightedDistance * (1 / currentSpeed - 1 / nextSpeed);
          efficiency = cost > 0 ? timeSaved / cost : 0;
        }
      }

      if (i === 13) {
        const scBonusCurrent = 1 + 0.01 * (state.levels[i] ?? 0);
        const delta = 0.01;

        const baseHustle = (state.charismaLvs[0] ?? 0) * 0.1;
        const hustleGain = baseHustle * delta;

        const baseRizz = (state.charismaLvs[1] ?? 0) * 0.02;
        const totalRizz = baseRizz * scBonusCurrent;
        const rizzGain = (baseRizz * delta) / (1 + totalRizz);

        const baseJoy = (state.charismaLvs[2] ?? 0) * 0.06;
        const joyWeight = state.patsPerHour / 5;
        const joyGain = (baseJoy * delta) * joyWeight;

        const baseMindful = (state.charismaLvs[4] ?? 0) * 0.1;
        const totalAccountLevels = state.levels.reduce((a, b) => a + b, 0);
        const mindfulWeight = 2.0 * Math.max(0.1, 1 - (totalAccountLevels / 2300));
        const mindfulGain = (baseMindful * delta) * mindfulWeight;

        const totalGainScore = hustleGain + rizzGain + joyGain + mindfulGain;
        const currentHustleTotal = (baseHustle * scBonusCurrent) + 1;

        let relativeSpeedup = totalGainScore / currentHustleTotal;
        timeSaved = isFinite(currentTimeToTarget) ? (relativeSpeedup * currentTimeToTarget) : 0;
        efficiency = cost > 0 ? timeSaved / cost : 0;
      }

      if (i === 15) {
        const rates = [0.02, 0.03, 0.04, 0.06, 0.10];
        let maxRelBoost = 0;
        for (let j = 0; j < 5; j++) {
          const currentGroup = 1 + (state.smokerValues[j] ?? 0) * (rates[j] ?? 0);
          const rel = (rates[j] ?? 0) / currentGroup;
          if (rel > maxRelBoost) maxRelBoost = rel;
        }
        timeSaved = isFinite(currentTimeToTarget) ? (maxRelBoost * currentTimeToTarget) : 0;
        efficiency = cost > 0 ? timeSaved / cost : 0;
      }

      return { cost, timeSaved, efficiency, icon: `/bubba/upg-${i}.png`, name: ["1st Slice", "Happi Boi", "Good Meat", "Bubba Boon", "Bargain", "Buyer Grin", "Charisma", "2nd Slice", "Megaflesh", "Fun Gifts", "Open Gift", "Great Meat", "Dice Roll", "Super Chart", "More Dice", "Smoker", "More Sides", "Uber Gifts", "Cost Saver", "Best Meat", "Real Love", "Spare Coins", "Loaded Dice", "3rd Slice", "Crossover", "2X Smoke", "Perma Sale", "Big Ol Coin"][i] };
    });
  });

  return { state, meatGen: computed(() => getMeatGen(state.levels, getHMultFromHappiness(state.activePats * (state.levels[1] ?? 0) * charismaBonuses.value.joy * (state.selectedGifts.includes(1) ? 1.5 : 1)))), target: computed(() => ({ name: "Megaflesh", cost: getUpgradeCost(8, state.levels[8] ?? 0, state.mindfulOffsets[8] ?? 0, state.levels), index: 8 })), upgradeAnalysis, bestUpgradeIndex: computed(() => { let bestIdx = -1, maxEff = 0; upgradeAnalysis.value.forEach((upg, i) => { if (i !== 8 && !MINDFUL_RESTRICTED.includes(i) && upg.efficiency > maxEff) { maxEff = upg.efficiency; bestIdx = i; } }); return bestIdx; }), getHMultFromHappiness, charismaBonuses, MINDFUL_RESTRICTED, diceStats, diceMulti, smokerMulti, spareCoinsMulti, maxPats, meatPerPat, twoHourSkip, openGiftMegaPush, megaPushSimulation };
};