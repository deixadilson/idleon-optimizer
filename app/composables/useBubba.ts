export type BubbaLevels = number[];

const state = reactive({
  levels: Array(28).fill(0) as BubbaLevels,
  mindfulOffsets: Array(28).fill(0) as BubbaLevels,
  charismaLvs: [0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number],
  emulsifiedIndex: null as number | null,
  selectedGifts: [-1, -1],
  diceValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as number[],
  smokerValues: [0, 0, 0, 0, 0] as number[],
  currentMeat: 0,
  activePats: 0,
  patsPerHour: 0,
  poppyFishPower: 0,
  coinsFound: 0,
});

export const useBubba = () => {
  const FACTORS = [1.07, 1.3, 1.07, 10, 1.12, 1.5, 1.1, 1.1, 125, 3000, 3, 1.1, 25, 1.8, 75000, 1.2, 1000, 1.6, 1.23, 1.12, 1.5, 1.8, 1.3, 1.22, 1.75, 1.12, 1.3, 1.5];
  const MULTI = [1, 1, 0.6, 1, 1, 1.3, 1, 1, 1.6, 0.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const MINDFUL_RESTRICTED = [3, 8, 9, 10, 12, 14, 15, 16];

  const diceStats = computed(() => {
    const isSooshi = (state.levels[8] ?? 0) >= 5;
    const count = 1 + (isSooshi ? 1 : 0) + (state.levels[14] ?? 0);
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
    const getEmulsifyFact = (idx: number) => (isMF6 && state.emulsifiedIndex === idx) ? 3 : 1;
    return {
      hustle: (lvs[0] ?? 0) * 0.1 * superChartBonus * getEmulsifyFact(0) + 1,
      rizzDisc: 1 - 1 / (1 + 0.02 * (lvs[1] ?? 0) * superChartBonus * getEmulsifyFact(1)),
      joy: (1 + ((lvs[2] ?? 0) * 0.05 * 1.2 * superChartBonus)) * getEmulsifyFact(2),
      mindful: 0.1 * (lvs[4] ?? 0) * superChartBonus * getEmulsifyFact(4)
    };
  });

  const getCostReduction = (levels: BubbaLevels) => {
    const rizzDisc = charismaBonuses.value.rizzDisc;
    const bargainDisc = 1 - 1 / (1 + 0.01 * (levels[4] ?? 0));
    const costSaverDisc = 1 - 1 / (1 + 0.02 * (levels[18] ?? 0));
    const permaSaleDisc = 1 - 1 / (1 + 0.04 * (levels[26] ?? 0));
    return (1 - rizzDisc) * (1 - bargainDisc) * (1 - costSaverDisc) * (1 - permaSaleDisc);
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
    const coinsMult = 1 + (state.coinsFound * ((levels[21] ?? 0) / 100));
    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + ((levels[17] ?? 0) / 100)) : 1;

    return baseSlices * 60 * (D84 / 100) * mf1Mult * diceMulti.value * charismaBonuses.value.hustle * coinsMult * poppyMult * beegSliceMult * hMult;
  };

  const upgradeAnalysis = computed(() => {
    const joyMulti = charismaBonuses.value.joy;
    const giftHappyMult = state.selectedGifts.includes(1) ? 1.5 : 1;
    const currentHMult = getHMultFromHappiness(state.activePats * state.levels[1] * joyMulti * giftHappyMult);

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
      const cost = getUpgradeCost(i, state.levels[i] ?? 0, state.mindfulOffsets[i] ?? 0, state.levels);
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
        const deltaS = ((1 + 0.05 * (charLv + 1)) / (1 + 0.05 * charLv)) - 1;

        const remHustle = Math.max(0, 120 - (state.charismaLvs[0] ?? 0));
        const remRizz = Math.max(0, 120 - (state.charismaLvs[1] ?? 0));
        const remJoy = Math.max(0, 120 - (state.charismaLvs[2] ?? 0));
        const remMindful = Math.max(0, 120 - (state.charismaLvs[4] ?? 0));

        const joyWeight = state.patsPerHour / 5;
        const totalAccountLevels = state.levels.reduce((a, b) => a + b, 0);
        const mindfulWeight = 2.0 * Math.max(0.1, 1 - (totalAccountLevels / 2300));

        const potentialProfit = (remHustle * 1.0 * 1.0) +
          (remRizz * 1.2 * 1.0) +
          (remJoy * 0.8 * joyWeight) +
          (remMindful * 1.5 * mindfulWeight);

        const currentHustleMult = (state.charismaLvs[0] ?? 0) * 0.1 * (1 + 0.01 * (state.levels[13] ?? 0)) + 1;
        const relativeFuturePower = potentialProfit / currentHustleMult;

        timeSaved = isFinite(currentTimeToTarget) ? (deltaS * relativeFuturePower * currentTimeToTarget * 0.01) : 0;
        efficiency = cost > 0 ? timeSaved / cost : 0;
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

      return { cost, timeSaved, efficiency, icon: `/bubba/upg-${i}.png`, name: ["1st Slice", "Happi Boi", "Good Meat", "Bubba Boon", "Bargain", "Buyer Grin", "Charisma", "2nd Slice", "Megaflesh", "Fun Gifts", "Open Gift", "Great Meat", "Dice Roll", "Super Chart", "More Dice", "Smoker", "More Sides", "Uber Gifts", "Cost Saver", "Best Meat", "Real Love", "Spare Coins", "Loaded Dice", "3rd Slice", "Crossover", "2X Smoke", "Perma Sale", "Big Ol Coin"][i] };
    });
  });

  return { state, meatGen: computed(() => getMeatGen(state.levels, getHMultFromHappiness(state.activePats * (state.levels[1] ?? 0) * charismaBonuses.value.joy * (state.selectedGifts.includes(1) ? 1.5 : 1)))), target: computed(() => ({ name: "Megaflesh", cost: getUpgradeCost(8, state.levels[8] ?? 0, state.mindfulOffsets[8] ?? 0, state.levels), index: 8 })), upgradeAnalysis, bestUpgradeIndex: computed(() => { let bestIdx = -1, maxEff = 0; upgradeAnalysis.value.forEach((upg, i) => { if (i !== 8 && !MINDFUL_RESTRICTED.includes(i) && upg.efficiency > maxEff) { maxEff = upg.efficiency; bestIdx = i; } }); return bestIdx; }), getHMultFromHappiness, charismaBonuses, MINDFUL_RESTRICTED, diceStats, diceMulti };
};