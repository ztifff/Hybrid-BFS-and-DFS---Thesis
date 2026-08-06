function calcNodes(targetNodes) {
  let aisles = Math.min(18, Math.max(2, Math.round(Math.sqrt(targetNodes * 1.5))));
  const totalSections = Math.max(aisles, targetNodes - 1 - (2 * aisles));
  const sectionsPerAisle = Math.max(1, Math.floor(totalSections / aisles));
  
  return 1 + 2 * aisles + aisles * sectionsPerAisle;
}

const uniqueSizes = new Set();
for (let i = 10; i <= 217; i++) {
  uniqueSizes.add(calcNodes(i));
}

console.log(Array.from(uniqueSizes).sort((a,b) => a-b));
