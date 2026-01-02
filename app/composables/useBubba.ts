export type BubbaLevels = number[];

// Estado Global
const state = reactive({
  levels: Array(28).fill(0) as BubbaLevels,         
  mindfulOffsets: Array(28).fill(0) as BubbaLevels, 
  charismaLvs: [0, 0, 0, 0, 0, 0],
  emulsifiedIndex: null as number | null, 
  selectedGifts: [-1, -1],
  currentMeat: 0,
  activePats: 0,
  poppyFishPower: 0,
  coinsFound: 0,
});

export const useBubba = () => {
  const FACTORS = [1.07, 1.3, 1.07, 10, 1.12, 1.5, 1.1, 1.1, 125, 3000, 3, 1.1, 25, 1.8, 75000, 1.2, 1000, 1.6, 1.23, 1.12, 1.5, 1.8, 1.3, 1.22, 1.75, 1.12, 1.3, 1.5];
  const MULTI = [1, 1, 0.6, 1, 1, 1.3, 1, 1, 1.6, 0.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const MINDFUL_RESTRICTED = [3, 8, 9, 10, 12, 14, 15, 16];

  const charismaBonuses = computed(() => {
    const lvs = state.charismaLvs;
    const superChartLv = state.levels[13];
    const superChartBonus = 1 + (superChartLv * 0.01);
    const isMF6 = state.levels[8] >= 6;
    const getEmulsifyFact = (idx: number) => (isMF6 && state.emulsifiedIndex === idx) ? 3 : 1;

    return {
      hustle: lvs[0] * 0.1 * superChartBonus * getEmulsifyFact(0) + 1,
      rizzDisc: 1 - 1 / (1 + 0.02 * lvs[1] * superChartBonus * getEmulsifyFact(1)),
      joy: (1 + (lvs[2] * 0.05 * 1.2)) * getEmulsifyFact(2),
      mindful: 0.1 * lvs[4] * getEmulsifyFact(4)
    };
  });

  const getCostReduction = (levels: BubbaLevels) => {
    const rizzDisc = charismaBonuses.value.rizzDisc;
    const bargainDisc = 1 - 1 / (1 + 0.01 * levels[4]);
    const costSaverDisc = 1 - 1 / (1 + 0.02 * levels[18]);
    const permaSaleDisc = 1 - 1 / (1 + 0.04 * levels[26]);
    return (1 - rizzDisc) * (1 - bargainDisc) * (1 - costSaverDisc) * (1 - permaSaleDisc);
  };

  const getUpgradeCost = (index: number, lv: number, offset: number, prodLevels: BubbaLevels) => {
    const reduction = getCostReduction(prodLevels);
    const costLv = Math.max(0, lv - offset); 
    const term1 = Math.pow(index + 1, 2) * costLv;
    const term2 = Math.pow(2.4 + index / 3.65, index) * Math.pow(FACTORS[index], costLv);
    return Math.round(reduction * (term1 + term2) * MULTI[index]);
  };

  const getHMultFromHappiness = (h: number) => {
    if (h <= 1) return 1;
    return 1 + 0.1 * (Math.log2(h) + 25 * Math.log10(h) + Math.pow(h, 0.75));
  };

  const getMeatGen = (levels: BubbaLevels, hMult: number) => {
    const baseSlices = (levels[0] * 1) + (levels[7] * 6) + (levels[23] * 50);
    if (baseSlices === 0) return 0;
    const D84 = (levels[2] * 2) + (8 * levels[11]) + (levels[19] * 25) + 100;
    const totalLv = levels.reduce((a, b) => a + b, 0);
    const mf1Mult = levels[8] >= 1 ? 1 + (totalLv / 100) : 1;
    const poppyMult = 1 + (levels[24] * 0.05 * state.poppyFishPower);
    const coinsMult = 1 + (state.coinsFound * (levels[21] / 100));
    const beegSliceMult = state.selectedGifts.includes(0) ? (2 + (levels[17] / 100)) : 1;
    return baseSlices * 60 * (D84 / 100) * mf1Mult * charismaBonuses.value.hustle * coinsMult * poppyMult * beegSliceMult * hMult;
  };

  const upgradeAnalysis = computed(() => {
    const joyMulti = charismaBonuses.value.joy;
    const giftHappyMult = state.selectedGifts.includes(1) ? 1.5 : 1;
    const currentH = state.activePats * state.levels[1] * joyMulti * giftHappyMult;
    const currentHMult = getHMultFromHappiness(currentH);
    
    const getAvgHMult = (lv: number) => {
        const hPerPat = lv * joyMulti * giftHappyMult;
        if (hPerPat <= 0) return 1;
        const peakBoost = getHMultFromHappiness(hPerPat) - 1;
        const effectiveSeconds = peakBoost * Math.sqrt(hPerPat) * 1.2;
        return 1 + (10 * effectiveSeconds / 3600);
    };

    const targetIdx = 8;
    const targetCost = getUpgradeCost(targetIdx, state.levels[targetIdx], state.mindfulOffsets[targetIdx], state.levels);
    const genCurrent = getMeatGen(state.levels, currentHMult);
    const currentTimeToTarget = genCurrent > 0 ? (targetCost - state.currentMeat) / (genCurrent / 60) : Infinity;

    return state.levels.map((_, i) => {
      const cost = getUpgradeCost(i, state.levels[i], state.mindfulOffsets[i], state.levels);
      const nextLevels = [...state.levels]; nextLevels[i]++;
      const nGen = (i === 1) ? getMeatGen(nextLevels, getAvgHMult(nextLevels[1])) : getMeatGen(nextLevels, currentHMult);
      const nTarget = getUpgradeCost(targetIdx, nextLevels[targetIdx], state.mindfulOffsets[targetIdx], nextLevels);
      const nTimeToTarget = nGen > 0 ? (nTarget - (state.currentMeat - cost)) / (nGen / 60) : Infinity;
      let timeSaved = currentTimeToTarget - nTimeToTarget;
      if (i === 5) timeSaved *= 0.00001;
      return { cost, timeSaved, efficiency: cost > 0 ? timeSaved / cost : 0, icon: `/bubba/upg-${i}.png`, name: ["1st Slice", "Happi Boi", "Good Meat", "Bubba Boon", "Bargain", "Buyer Grin", "Charisma", "2nd Slice", "Megaflesh", "Fun Gifts", "Open Gift", "Great Meat", "Dice Roll", "Super Chart", "More Dice", "Smoker", "More Sides", "Uber Gifts", "Cost Saver", "Best Meat", "Real Love", "Spare Coins", "Loaded Dice", "3rd Slice", "Crossover", "2X Smoke", "Perma Sale", "Big Ol Coin"][i] };
    });
  });

  return { state, meatGen: computed(() => getMeatGen(state.levels, getHMultFromHappiness(state.activePats * state.levels[1] * charismaBonuses.value.joy * (state.selectedGifts.includes(1) ? 1.5 : 1)))), target: computed(() => ({ name: "Megaflesh", cost: getUpgradeCost(8, state.levels[8], state.mindfulOffsets[8], state.levels), index: 8 })), upgradeAnalysis, bestUpgradeIndex: computed(() => { let bestIdx = -1, maxEff = 0; upgradeAnalysis.value.forEach((upg, i) => { if (i !== 3 && i !== 8 && upg.efficiency > maxEff) { maxEff = upg.efficiency; bestIdx = i; } }); return bestIdx; }), getHMultFromHappiness, charismaBonuses, MINDFUL_RESTRICTED };
};