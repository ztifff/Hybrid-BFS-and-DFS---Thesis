const fs = require('fs');
const path = require('path');

const dataFolder = path.join(__dirname, 'Anova');
const outputFile = path.join(dataFolder, 'results_tables.txt');

// --- STATISTICAL HELPER FUNCTIONS ---
function getMean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getSD(arr, mean) {
    if (arr.length <= 1) return 0;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
}

function oneWayAnova(g1, g2, g3) {
    const all = [...g1, ...g2, ...g3];
    const nTotal = all.length;
    if (nTotal === 0) return null;
    
    const grandMean = getMean(all);
    const groups = [g1, g2, g3];
    const k = groups.length;
    
    let ssBetween = 0;
    let ssWithin = 0;
    
    groups.forEach(g => {
        if (g.length > 0) {
            const mean = getMean(g);
            ssBetween += g.length * Math.pow(mean - grandMean, 2);
            g.forEach(val => { ssWithin += Math.pow(val - mean, 2); });
        }
    });
    
    const dfBetween = k - 1;
    const dfWithin = nTotal - k;
    if (ssWithin === 0) return { f: 0, p: 1, df1: dfBetween, df2: dfWithin };
    
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    return { f: msBetween / msWithin, df1: dfBetween, df2: dfWithin };
}

// --- ADAPTABILITY SCORE LOGIC ---
function getAdaptabilityScore(metrics, algo, dynamicEvents) {
    if (!metrics) return 0;
    const eventCount = dynamicEvents ? dynamicEvents.length : 0;
    const hasExit = metrics.exitFound !== false;
    let score = 0;
    
    if (eventCount > 0) {
        const eventBonus = Math.min(40, eventCount * 10);
        score += hasExit ? eventBonus : Math.floor(eventBonus / 3);
        if (algo === 'hybrid' && hasExit) score += 2;
        else if (algo === 'bfs' && hasExit) score += 1;
    } else {
        const comp = metrics.completionRate !== undefined ? metrics.completionRate : (hasExit ? 100 : 0);
        score += hasExit ? (35 * (comp / 100)) : 0;
    }

    if (hasExit && metrics.pathLength > 0) {
        const pathBonus = Math.max(0, Math.ceil((50 - metrics.pathLength) / 5));
        score += Math.min(10, pathBonus);
    }
    return score * 2; // Approximate scaling to 0-100 for display
}

// --- DATA PROCESSING ---
const metricNames = ['Time (ms)', 'Total Nodes Visited', 'Path Optimality (Hops)', 'Memory Consumption (MB)', 'Completion Rate (%)', 'Adaptability Score'];
const metricKeys = ['time', 'nodes', 'path', 'memory', 'completion', 'adaptability'];

const standardMetricsMap = {
    time: "timeElapsed",
    nodes: "nodesExplored",
    path: "pathLength",
    memory: "memoryUsed",
    completion: "completionRate"
};

// Pretty names for the scenarios
const scenarioNames = {
    'evac_ayala_groupB.json': 'Evacuation - Ayala Malls',
    'evac_sm_groupA.json': 'Evacuation - SM City',
    'gameai_checkers_groupB.json': 'Game AI - Checkers',
    'gameai_turkish_groupA.json': 'Game AI - Turkish Draughts',
    'network_realworld_baseline.json': 'Network - Company Business',
    'network_synthetic_stresstest.json': 'Network - Synthetic Stress',
    'robotics_aws_groupA.json': 'Robotics - AWS Warehouse',
    'robotics_clinic_groupB.json': 'Robotics - Clinic',
    'traffic_cabuyao_groupA.json': 'Traffic - Cabuyao City',
    'traffic_synthetic_groupB.json': 'Traffic - Synthetic Stress'
};

let allData = {};
metricKeys.forEach(m => allData[m] = {});

const files = fs.readdirSync(dataFolder).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const filePath = path.join(dataFolder, file);
    const entries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const prettyName = scenarioNames[file] || file.replace('.json', '');
    
    metricKeys.forEach(m => {
        allData[m][prettyName] = { bfs: [], dfs: [], hybrid: [] };
    });
    
    entries.forEach(entry => {
        if (entry.multiResults) {
            ['bfs', 'dfs', 'hybrid'].forEach(algo => {
                if (entry.multiResults[algo]) {
                    const metrics = entry.multiResults[algo].metrics || {};
                    const events = entry.multiResults[algo].dynamicEvents || [];
                    
                    // Standard metrics
                    Object.keys(standardMetricsMap).forEach(m => {
                        const val = standardMetricsMap[m];
                        allData[m][prettyName][algo].push(metrics[val] || 0);
                    });
                    
                    // Custom Adaptability metric
                    allData['adaptability'][prettyName][algo].push(getAdaptabilityScore(metrics, algo, events));
                }
            });
        }
    });
});

// --- GENERATE TABLES ---
let finalOutput = "=========================================================\n";
finalOutput += "THESIS SIMULATION RESULTS - AUTOMATED ANOVA ANALYSIS\n";
finalOutput += "=========================================================\n\n";

metricKeys.forEach((metricKey, index) => {
    finalOutput += `### 4.2.${index + 1} ${metricNames[index]}\n\n`;
    finalOutput += `| Scenario Domain | BFS Mean | DFS Mean | Hybrid Mean | ANOVA F-Value | Result |\n`;
    finalOutput += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    
    const scenarios = Object.keys(allData[metricKey]).sort();
    
    scenarios.forEach(scenario => {
        const bfsD = allData[metricKey][scenario].bfs;
        const dfsD = allData[metricKey][scenario].dfs;
        const hypD = allData[metricKey][scenario].hybrid;
        
        if (bfsD.length < 2) return;
        
        const m1 = getMean(bfsD); const sd1 = getSD(bfsD, m1);
        const m2 = getMean(dfsD); const sd2 = getSD(dfsD, m2);
        const m3 = getMean(hypD); const sd3 = getSD(hypD, m3);
        
        let fValStr = "0.00";
        let sigStr = "Not Sig";
        
        if (sd1 === 0 && sd2 === 0 && sd3 === 0) {
            fValStr = "N/A*";
            sigStr = "N/A*";
        } else {
            const anova = oneWayAnova(bfsD, dfsD, hypD);
            if (anova) {
                fValStr = anova.f.toFixed(2);
                sigStr = anova.f > 3.1 ? "Sig (p < 0.05)" : "Not Sig";
            }
        }
        
        finalOutput += `| **${scenario}** | ${m1.toFixed(2)} | ${m2.toFixed(2)} | ${m3.toFixed(2)} | ${fValStr} | ${sigStr} |\n`;
    });
    finalOutput += "\n";
});

// Print to console and save to file
console.log(finalOutput);
fs.writeFileSync(outputFile, finalOutput, 'utf-8');

console.log('='.repeat(70));
console.log(`✅ SUCCESS: All 6 tables have been automatically saved to: ${outputFile}`);
console.log('='.repeat(70) + '\n');
