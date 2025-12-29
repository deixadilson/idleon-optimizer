// Validando fórmula de geração de penas da planilha

const owl = 750; // %
const restartLv = 39;
const lv0 = 1272;
const lv5 = 761;
const lv3 = 624;
const lv7 = 347;
const lv2 = 905;
const shinyCount = 935;
const lv6 = 255; // você disse 256, mas no JSON era 255
const gambit = 7.53;

const targetGen = 9.91e38;

// Fórmula da planilha (com Obsidian e Maple ativos, restartMult = 5)
// (owl%+1) * power(5, restartLv) * (lv0 + 5*lv5 + 2*lv3 + 4*lv7) * (1 + lv2/20) * (1 + shinyCount*lv6/100) * 10

const owlMult = (owl / 100) + 1;  // 8.5
const restartMult = Math.pow(5, restartLv);
const baseGen = lv0 + 5 * lv5 + 2 * lv3 + 4 * lv7;
const featherMult = 1 + lv2 / 20;
const shinyMult = 1 + (shinyCount * lv6 / 100);
const mapleMult = 10;

console.log("=== COMPONENTES DA PLANILHA ===");
console.log("Owl mult:", owlMult);
console.log("Restart mult (5^39):", restartMult.toExponential(2));
console.log("Base gen:", baseGen);
console.log("Feather mult:", featherMult);
console.log("Shiny mult:", shinyMult.toFixed(2));
console.log("Maple mult:", mapleMult);
console.log();

// Fórmula da planilha (sem gambit)
const genPlanilha = owlMult * restartMult * baseGen * featherMult * shinyMult * mapleMult;
console.log("Geração (planilha, sem gambit):", genPlanilha.toExponential(2));
console.log("Geração no jogo:", targetGen.toExponential(2));
console.log("Razão (jogo/planilha):", (targetGen / genPlanilha).toFixed(4));
console.log();

// Com gambit
const genComGambit = genPlanilha * gambit;
console.log("Geração (com gambit):", genComGambit.toExponential(2));
console.log("Razão (jogo/calc):", (targetGen / genComGambit).toFixed(4));
console.log();

// Comparando com nossa fórmula atual
// Nossa fórmula usa: 5 * Math.pow(5, restartLv) que dá 5x a mais
const nossaRestartMult = 5 * Math.pow(5, restartLv);
console.log("Nossa restart mult (5 * 5^39):", nossaRestartMult.toExponential(2));
console.log("Diferença:", (nossaRestartMult / restartMult).toFixed(1) + "x");
