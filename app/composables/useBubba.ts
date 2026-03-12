export type BubbaLevels = number[];

const state = reactive({
  levels: Array(28).fill(0) as BubbaLevels,
  mindfulOffsets: Array(28).fill(0) as BubbaLevels,
  upgradeWeights: Array(28).fill(1) as number[],
  charismaLvs: [0, 0, 0, 0, 0, 0] as number[],
  emulsifiedIndices: [] as number[],
  selectedGifts: [-1, -1],
  diceValues: [0, 0, 0, 0, 0, 0, 0, 0] as number[],
  smokerValues: [0, 0, 0, 0, 0] as number[],
  coinValues: [0, 0, 0, 0] as number[],
  currentMeat: 0,
  activePats: 0,
  patsPerHour: 0,
  poppyFishPower: 0,
  saturnhead: false,
  megaPushConfig: {
    patsUsed: 0,
    giftsUsed: 0,
    clicksPerSecond: 8,
    mouseSpeed: 'medium' as 'slow' | 'medium' | 'fast' | 'instant',
    emulsifyJoyBefore: true,
    emulsifyHustleAfter: false,
    emulsifyRizzAfter: false,
    isSaved: false,
  }
});

export const useBubba = () => {
  const FACTORS = [1.07, 1.3, 1.07, 10, 1.12, 1.5, 1.1, 1.1, 125, 3000, 3, 1.1, 25, 1.8, 75000, 1.2, 1000, 1.6, 1.23, 1.12, 1.5, 1.8, 1.3, 1.22, 1.75, 1.12, 1.3, 1.5];
  const MULTI = [1, 1, 0.6, 1, 1, 1.3, 1, 1, 1.6, 0.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const UPGRADE_NAMES = ["1st Slice", "Happi Boi", "Good Meat", "Bubba Boon", "Bargain", "Buyer Grin", "Charisma", "2nd Slice", "Megaflesh", "Fun Gifts", "Open Gift", "Great Meat", "Dice Roll", "Super Chart", "More Dice", "Smoker", "More Sides", "Uber Gifts", "Cost Saver", "Best Meat", "Real Love", "Spare Coins", "Loaded Dice", "3rd Slice", "Crossover", "2X Smoke", "Perma Sale", "Big Ol Coin"];
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
      hustle: (lvs[0] ?? 0) * getEmulsifyFact(0) * 0.1 * superChartBonus + 1,
      rizz: 1 - 1 / (1 + 0.02 * (lvs[1] ?? 0) * getEmulsifyFact(1) * superChartBonus),
      joy: 1 + ((lvs[2] ?? 0) * getEmulsifyFact(2) * 0.05 * superChartBonus),
      courage: (lvs[3] ?? 0) * getEmulsifyFact(3) * superChartBonus,
      mindful: 0.1 * (lvs[4] ?? 0) * getEmulsifyFact(4) * superChartBonus,
      savvy: (lvs[5] ?? 0) * getEmulsifyFact(5) * superChartBonus
    };
  });

  const smokerMulti = computed(() => {
    const rates = [0.02, 0.03, 0.04, 0.06, 0.10];
    return state.smokerValues.reduce((acc, val, i) => acc * (1 + (val ?? 0) * (rates[i] ?? 0)), 1);
  });

  const spareCoinsMulti = computed(() => {
    const [c1, c2, c3, c4] = state.coinValues;
    return 1 + ((c1 ?? 0) + 5 * (c2 ?? 0) + 25 * (c3 ?? 0) + 100 * (c4 ?? 0)) / 100;
  });

  const maxPats = computed(() => {
    const lv = state.levels[1] ?? 0;
    if (lv <= 1) return 1 * 2;
    if (lv === 2) return 3 * 2;
    const baseline = Math.floor(Math.log2(lv - 1)) + 4;
    return baseline * 2;
  });

  const meatPerPat = computed(() => {
    const joyBonus = charismaBonuses.value.joy - 1;
    const giftBonus = state.selectedGifts.includes(1) ? 0.5 : 0;
    const realLoveBonus = (state.levels[20] ?? 0) / 100;
    const hPerPat = (state.levels[1] ?? 0) * (1 + joyBonus + giftBonus + realLoveBonus);
    if (hPerPat <= 0) return 0;

    let effectiveSeconds = 0;
    let simH = hPerPat;
    const dt = 0.2;
    let steps = 0;
    while (simH > 0 && steps < 5000) {
      const bonus = getHMultFromHappiness(simH) - 1;
      effectiveSeconds += bonus * dt;

      const decay = getDecayRate(simH);
      const drop = decay * dt;
      simH = Math.max(0, simH - drop);
      steps++;
    }

    const baseMeatPerSec = getMeatGen(state.levels, 1) / 60;
    return baseMeatPerSec * effectiveSeconds;
  });

  const twoHourSkip = computed(() => {
    return (getMeatGen(state.levels, 1) / 60) * 120 * 60;
  });

  const getDecayRate = (h: number) => {
    return Math.max(1, h / 13);
  };

  const calculateOptimalGifts = (startH: number, cps: number, baseMeatRate: number, currentLevels: BubbaLevels, currentOffsets: BubbaLevels, overrideRizz?: number) => {
    let optH = startH;
    let optimalGifts = 0;
    let optLevels = [...currentLevels];
    let simUpgradeIdx = 10;

    const clickDuration = 1 / cps;

    while (true) {
      const cost = getUpgradeCost(simUpgradeIdx, optLevels[simUpgradeIdx] ?? 0, currentOffsets[simUpgradeIdx] ?? 0, optLevels, overrideRizz);
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

  /**
   * Simplified Mega Push estimate for the summary bar.
   * Assumes a single batch of pats (no doubling technique) and instant purchase of profitable gifts.
   * Logic matches the "Happiness Meter" (Happiness = Pats * hPerPat).
   */
  const openGiftMegaPush = computed(() => {
    const pats = maxPats.value / 2; // Single recharge batch

    // Instant happiness calculation (matching current UI Meter logic)
    const bonuses = charismaBonuses.value;
    const joyBonus = bonuses.joy - 1;
    const giftBonus = state.selectedGifts.includes(1) ? 0.5 : 0;
    const realLoveBonus = (state.levels[20] ?? 0) / 100;
    const hPerPat = (state.levels[1] ?? 0) * (1 + joyBonus + giftBonus + realLoveBonus);
    const currentH = pats * hPerPat;

    const hMult = getHMultFromHappiness(currentH);
    const baseMeatRate = getMeatGen(state.levels, 1); // Get rate per minute (hMult=1)

    // Instant profitable gift calculation (no decay and no CPS dependency)
    let totalProfit = 0;
    let optimalCount = 0;
    let simLevels = [...state.levels];

    while (true) {
      const cost = getUpgradeCost(10, simLevels[10] ?? 0, state.mindfulOffsets[10] ?? 0, simLevels, bonuses.rizz);
      const yieldAmt = 20 * baseMeatRate * hMult;

      if (cost > yieldAmt) break;

      totalProfit += (yieldAmt - cost);
      optimalCount++;
      simLevels[10] = (simLevels[10] ?? 0) + 1;

      if (optimalCount > 1000) break;
    }

    return { count: optimalCount, yield: totalProfit };
  });

  const megaPushSimulation = computed(() => {
    const config = state.megaPushConfig;
    const giftBonus = state.selectedGifts.includes(1) ? 0.5 : 0;
    const isMF6 = (state.levels[8] ?? 0) >= 6;

    const getSimulatedCharisma = (overrideEmulsified: number[]) => {
      const lvs = state.charismaLvs;
      const superChartLv = state.levels[13] ?? 0;
      const superChartBonus = 1 + (superChartLv * 0.01);
      const getEmulsifyFact = (idx: number) => (isMF6 && overrideEmulsified.includes(idx)) ? 3 : 1;
      return {
        hustle: (lvs[0] ?? 0) * getEmulsifyFact(0) * 0.1 * superChartBonus + 1,
        rizz: 1 - 1 / (1 + 0.02 * (lvs[1] ?? 0) * getEmulsifyFact(1) * superChartBonus),
        joy: 1 + ((lvs[2] ?? 0) * getEmulsifyFact(2) * 0.05 * superChartBonus),
      };
    };

    const isSaved = state.megaPushConfig.isSaved;
    let phase1Emulsified: number[];
    if (isSaved) {
      phase1Emulsified = state.emulsifiedIndices.filter(i => i > 2);
      if (config.emulsifyJoyBefore) phase1Emulsified.push(2);
    } else {
      phase1Emulsified = [...state.emulsifiedIndices];
    }

    const charBonusP1 = getSimulatedCharisma(phase1Emulsified);
    const realLoveBonus = (state.levels[20] ?? 0) / 100;
    const hPerPat = (state.levels[1] ?? 0) * (1 + (charBonusP1.joy - 1) + giftBonus + realLoveBonus);

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
    simulatePats(batch2Count);

    let phase2Emulsified = [...phase1Emulsified];
    let timeSpentSwitching = 0;

    if (config.emulsifyHustleAfter) {
      if (!phase2Emulsified.includes(0)) {
        timeSpentSwitching += moveTime + (2 / cps);
        phase2Emulsified.push(0);
      }
    } else if (phase2Emulsified.includes(0)) {
      timeSpentSwitching += moveTime + (2 / cps);
      phase2Emulsified = phase2Emulsified.filter(i => i !== 0);
    }

    if (config.emulsifyRizzAfter) {
      if (!phase2Emulsified.includes(1)) {
        timeSpentSwitching += moveTime + (2 / cps);
        phase2Emulsified.push(1);
      }
    } else if (phase2Emulsified.includes(1)) {
      timeSpentSwitching += moveTime + (2 / cps);
      phase2Emulsified = phase2Emulsified.filter(i => i !== 1);
    }

    if (timeSpentSwitching > 0) simulateDecay(timeSpentSwitching);

    const charBonusP3 = getSimulatedCharisma(phase2Emulsified);

    // Correct additive percentage pool for simulator
    const crossoverBonus = (state.levels[24] ?? 0) * 5 * state.poppyFishPower;
    const percentBonus = ((state.levels[2] ?? 0) * 2) + (8 * (state.levels[11] ?? 0)) + ((state.levels[19] ?? 0) * 25) + crossoverBonus;
    const percentMult = 1 + (percentBonus / 100);

    const baseSlices = ((state.levels[0] ?? 0) * 1) + ((state.levels[7] ?? 0) * 6) + ((state.levels[23] ?? 0) * 50);
    const totalLv = state.levels.reduce((a, b) => a + b, 0);
    const mf1Mult = (state.levels[8] ?? 0) >= 1 ? 1 + (totalLv / 100) : 1;
    const coinsMult = spareCoinsMulti.value;
    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + ((state.levels[17] ?? 0) / 100)) : 1;
    const baseMeatRate = baseSlices * 60 * percentMult * mf1Mult * diceMulti.value * smokerMulti.value * charBonusP3.hustle * coinsMult * beegSliceMult;

    let totalGrossYield = 0;
    let totalGiftCost = 0;
    const giftsToOpen = config.giftsUsed;
    let simH = currentH;
    let simLevels = [...state.levels];

    for (let i = 0; i < giftsToOpen; i++) {
      if (i === 0) simulateDecay(moveTime);

      const currentOpenGiftLv = simLevels[10] ?? 0;
      totalGiftCost += getUpgradeCost(10, currentOpenGiftLv, state.mindfulOffsets[10] ?? 0, simLevels, charBonusP3.rizz);
      simLevels[10] = currentOpenGiftLv + 1;

      const currenttotalLv = simLevels.reduce((a, b) => a + b, 0);
      const currentMf1Mult = (state.levels[8] ?? 0) >= 1 ? 1 + (currenttotalLv / 100) : 1;
      const currentMeatRate = (baseMeatRate / mf1Mult) * currentMf1Mult;

      totalGrossYield += 20 * currentMeatRate * getHMultFromHappiness(simH);
      simH = Math.max(0, simH - getDecayRate(simH) * (1 / cps));
    }

    let optH = currentH;
    simulateDecay(moveTime);
    const optimalGifts = calculateOptimalGifts(optH, cps, baseMeatRate, state.levels, state.mindfulOffsets, charBonusP3.rizz);

    return {
      totalYield: totalGrossYield - totalGiftCost,
      startSuggestion: (batch1Count > 0) ? (batch1Count / cps) : 0,
      maxHMult: getHMultFromHappiness(maxHReached),
      optimalGifts
    };
  });

  const getCostReduction = (levels: BubbaLevels, overrideRizz?: number) => {
    const rizz = overrideRizz !== undefined ? overrideRizz : charismaBonuses.value.rizz;
    const bargainDisc = 1 - 1 / (1 + 0.01 * (levels[4] ?? 0));
    const costSaverDisc = 1 - 1 / (1 + 0.02 * (levels[18] ?? 0));
    const permaSaleDisc = 1 - 1 / (1 + 0.04 * (levels[26] ?? 0));
    const saturnheadDisc = state.saturnhead ? 0.5 : 1;
    return (1 - rizz) * (1 - bargainDisc) * (1 - costSaverDisc) * (1 - permaSaleDisc) * saturnheadDisc;
  };

  const getUpgradeCost = (index: number, lv: number, offset: number, prodLevels: BubbaLevels, overrideRizz?: number) => {
    const reduction = getCostReduction(prodLevels, overrideRizz);
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

    // Additive percentage pool: Good Meat (2), Great Meat (11), Best Meat (19), Crossover (24)
    const crossoverBonus = (levels[24] ?? 0) * 5 * state.poppyFishPower;
    const percentBonus = ((levels[2] ?? 0) * 2) + (8 * (levels[11] ?? 0)) + ((levels[19] ?? 0) * 25) + crossoverBonus;
    const percentMult = 1 + (percentBonus / 100);

    const totalLv = levels.reduce((a, b) => a + b, 0);
    const mf1Mult = (levels[8] ?? 0) >= 1 ? 1 + (totalLv / 100) : 1;

    // Spare Coins upgrade (21) level doesn't improve meat directly
    const coinsMult = spareCoinsMulti.value;

    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + ((levels[17] ?? 0) / 100)) : 1;

    return baseSlices * 60 * percentMult * mf1Mult * diceMulti.value * smokerMulti.value * charismaBonuses.value.hustle * coinsMult * beegSliceMult * hMult;
  };

  const upgradeAnalysis = computed(() => {
    const joyBonus = charismaBonuses.value.joy - 1;
    const giftBonus = state.selectedGifts.includes(1) ? 0.5 : 0;
    const realLoveMultBase = 1 + (state.levels[20] ?? 0) / 100;
    const currentHMult = getHMultFromHappiness(state.activePats * (state.levels[1] ?? 0) * (1 + joyBonus + giftBonus + (realLoveMultBase - 1)));

    const getAvgHMult = (lv: number, rlMult: number = realLoveMultBase) => {
      const hPerPat = lv * (1 + joyBonus + giftBonus + (rlMult - 1));
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

      const nextLevels = [...state.levels];
      const currentNextLv = nextLevels[i];
      if (currentNextLv !== undefined) nextLevels[i] = currentNextLv + 1;

      let speedupMultiplier = 1;

      if (i === 5) {
        const b = (state.levels[0] || 0) + (state.levels[7] || 0) * 6 + (state.levels[23] || 0) * 50;
        speedupMultiplier = (b + 1) / (b + 0.9);
      }

      if (i === 6) {
        const hoursLeft = currentTimeToTarget / 60;
        if (isFinite(hoursLeft) && hoursLeft > 0) {
          const charLv = state.levels[i] ?? 0;
          const numbahsActive = state.selectedGifts.includes(2);
          const numbahsMult = numbahsActive ? 2.5 : 1;

          const getWeightedAverageValue = (speed: number) => {
            let t = 0;
            let currentAttribs = [...state.charismaLvs];
            let activeIndices = [0, 1, 2, 4].filter(idx => (currentAttribs[idx] ?? 0) < 120);
            let totalWeightedSum = 0;

            const calculateValue = (lvs: number[]) => {
              const h = lvs[0] ?? 0;
              const r = lvs[1] ?? 0;
              const j = lvs[2] ?? 0;
              const m = lvs[4] ?? 0;
              const joyFactor = 0.5 * 0.2 * state.patsPerHour;
              return h + (r * 0.2) + (j * joyFactor) + (m * 2.0);
            };

            while (t < hoursLeft) {
              const val = calculateValue(currentAttribs);
              let totalCharismaLvs = currentAttribs.reduce((a, b) => a + (b ?? 0), 0);
              const nextLvCost = 20 * (1 + totalCharismaLvs / 20) * Math.pow(1.03, totalCharismaLvs);
              const timeToNext = nextLvCost / speed;

              const dt = Math.min(timeToNext, hoursLeft - t);
              totalWeightedSum += val * dt;
              t += dt;

              if (t < hoursLeft) {
                let bestIdx = -1;
                let minLv = 121;
                activeIndices.forEach(idx => {
                  if ((currentAttribs[idx] ?? 0) < minLv) {
                    minLv = currentAttribs[idx] ?? 0;
                    bestIdx = idx;
                  }
                });

                if (bestIdx !== -1) {
                  currentAttribs[bestIdx] = (currentAttribs[bestIdx] ?? 0) + 1;
                  if (currentAttribs[bestIdx]! >= 120) {
                    activeIndices = activeIndices.filter(idx => idx !== bestIdx);
                  }
                } else {
                  totalWeightedSum += val * (hoursLeft - t);
                  t = hoursLeft;
                }
              }
            }
            return totalWeightedSum / hoursLeft;
          };

          const curS = (1 + 0.05 * charLv) * numbahsMult;
          const nxtS = (1 + 0.05 * (charLv + 1)) * numbahsMult;

          const valCur = getWeightedAverageValue(curS);
          const valNxt = getWeightedAverageValue(nxtS);

          const gainHustleEquiv = valNxt - valCur;
          const hustleStart = state.charismaLvs[0] ?? 0;
          const currentHustleMult = 1 + (0.1 * hustleStart);
          speedupMultiplier = 1 + (0.1 * gainHustleEquiv) / currentHustleMult;
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

        speedupMultiplier = 1 + totalGainScore / currentHustleTotal;
      }

      if (i === 14) {
        const { count, sides } = diceStats.value;

        let product = 1;
        let hasActiveDice = false;

        for (let j = 0; j < count; j++) {
          const val = state.diceValues[j] || 0;
          if (val > 0) {
            const scaledVal = val <= 6 ? val : 6 + (val - 6) * 0.4;
            product *= scaledVal;
            hasActiveDice = true;
          }
        }

        const maxScaledVal = sides <= 6 ? sides : 6 + (sides - 6) * 0.4;
        const newProduct = (hasActiveDice ? product : 1) * maxScaledVal;
        const expectedNextDiceMulti = 1 + (newProduct / 100);

        speedupMultiplier = expectedNextDiceMulti / diceMulti.value;
      }

      if (i === 15) {
        const rates = [0.02, 0.03, 0.04, 0.06, 0.10];
        let maxRelBoost = 0;
        for (let j = 0; j < 5; j++) {
          const currentGroup = 1 + (state.smokerValues[j] ?? 0) * (rates[j] ?? 0);
          const rel = (rates[j] ?? 0) / currentGroup;
          if (rel > maxRelBoost) maxRelBoost = rel;
        }
        speedupMultiplier = 1 + maxRelBoost;
      }

      if (i === 20) {
        const rlMultBase = 1 + (state.levels[20] ?? 0) / 100;
        const rlMultNext = 1 + ((state.levels[20] ?? 0) + 1) / 100;

        const hMultBase = getAvgHMult(state.levels[1] ?? 0, rlMultBase);
        const hMultNext = getAvgHMult(state.levels[1] ?? 0, rlMultNext);

        const genWithBase = getMeatGen(state.levels, hMultBase);
        const genWithNext = getMeatGen(state.levels, hMultNext);

        if (genWithBase > 0) {
          speedupMultiplier = genWithNext / genWithBase;
        }
      }

      const isHappiBoi = (i === 1);
      const baselineGen = isHappiBoi ? getMeatGen(state.levels, getAvgHMult(state.levels[1] ?? 0)) : genCurrent;
      let nGen = isHappiBoi ? getMeatGen(nextLevels, getAvgHMult(nextLevels[1] ?? 0)) : getMeatGen(nextLevels, currentHMult);

      nGen *= speedupMultiplier;

      const nTarget = getUpgradeCost(targetIdx, state.levels[targetIdx] ?? 0, state.mindfulOffsets[targetIdx] ?? 0, nextLevels);

      const baselineTimeToTarget = baselineGen > 0 ? (targetCost - state.currentMeat) / (baselineGen / 60) : Infinity;
      const nTimeToTarget = nGen > 0 ? (nTarget - (state.currentMeat - cost)) / (nGen / 60) : Infinity;

      let timeSaved = baselineTimeToTarget - nTimeToTarget;

      if (i === 10 && state.selectedGifts.includes(0)) {
        timeSaved += 1200;
      }

      let efficiency = cost > 0 ? (timeSaved * (state.upgradeWeights[i] ?? 1)) / cost : 0;

      return { cost, timeSaved, efficiency, icon: `/bubba/upg-${i}.png`, name: UPGRADE_NAMES[i] };
    });
  });

  return {
    state, UPGRADE_NAMES,
    meatGen: computed(() => getMeatGen(state.levels, getHMultFromHappiness(state.activePats * (state.levels[1] ?? 0) * (1 + (charismaBonuses.value.joy - 1) + (state.selectedGifts.includes(1) ? 0.5 : 0) + (state.levels[20] ?? 0) / 100)))), target: computed(() => ({ name: "Megaflesh", cost: getUpgradeCost(8, state.levels[8] ?? 0, state.mindfulOffsets[8] ?? 0, state.levels), index: 8 })), upgradeAnalysis, bestUpgradeIndex: computed(() => { let bestIdx = -1, maxEff = 0; upgradeAnalysis.value.forEach((upg, i) => { if (i !== 8 && !MINDFUL_RESTRICTED.includes(i) && upg.efficiency > maxEff) { maxEff = upg.efficiency; bestIdx = i; } }); return bestIdx; }), getHMultFromHappiness, charismaBonuses, MINDFUL_RESTRICTED, diceStats, diceMulti, smokerMulti, spareCoinsMulti, maxPats, meatPerPat, twoHourSkip, openGiftMegaPush, megaPushSimulation, getUpgradeCost
  };
};