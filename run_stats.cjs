const fs = require('fs');
const path = require('path');

const dataFolder = path.join(__dirname, 'Anova');
const outputFile = path.join(dataFolder, 'results.txt');

// We will store all the text in this array so we can print it AND save it to a file.
let outputText = [];

function printAndSave(text) {
    console.log(text);
    outputText.push(text);
}

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
            g.forEach(val => {
                ssWithin += Math.pow(val - mean, 2);
            });
        }
    });
    
    const dfBetween = k - 1;
    const dfWithin = nTotal - k;
    
    if (ssWithin === 0) return { f: 0, p: 1, df1: dfBetween, df2: dfWithin };
    
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const fValue = msBetween / msWithin;
    
    return { f: fValue, df1: dfBetween, df2: dfWithin };
}

const metricsMap = {
    time: "timeElapsed",
    nodes: "nodesExplored",
    path: "pathLength",
    memory: "memoryUsed",
    completion: "completionRate"
};

fs.readdirSync(dataFolder).forEach(file => {
    if (!file.endsWith('.json')) return;
    
    const filePath = path.join(dataFolder, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    let entries;
    try {
        entries = JSON.parse(content);
    } catch (e) { return; }
    
    const data = { bfs: {}, dfs: {}, hybrid: {} };
    for (let algo of ['bfs', 'dfs', 'hybrid']) {
        for (let m of Object.keys(metricsMap)) {
            data[algo][m] = [];
        }
    }
    
    entries.forEach(entry => {
        if (entry.multiResults) {
            ['bfs', 'dfs', 'hybrid'].forEach(algo => {
                if (entry.multiResults[algo] && entry.multiResults[algo].metrics) {
                    for (let [m_key, m_val] of Object.entries(metricsMap)) {
                        data[algo][m_key].push(entry.multiResults[algo].metrics[m_val] || 0);
                    }
                }
            });
        }
    });
    
    printAndSave('\n' + '='.repeat(70));
    printAndSave('SCENARIO: ' + file);
    printAndSave('='.repeat(70));
    
    for (let m of Object.keys(metricsMap)) {
        const bfsD = data.bfs[m];
        const dfsD = data.dfs[m];
        const hypD = data.hybrid[m];
        
        if (bfsD.length < 2) continue;
        
        const m1 = getMean(bfsD), sd1 = getSD(bfsD, m1);
        const m2 = getMean(dfsD), sd2 = getSD(dfsD, m2);
        const m3 = getMean(hypD), sd3 = getSD(hypD, m3);
        
        printAndSave(`\n--- Metric: ${m.toUpperCase()} ---`);
        printAndSave(`BFS    -> Mean: ${m1.toFixed(4)}, SD: ${sd1.toFixed(4)}`);
        printAndSave(`DFS    -> Mean: ${m2.toFixed(4)}, SD: ${sd2.toFixed(4)}`);
        printAndSave(`Hybrid -> Mean: ${m3.toFixed(4)}, SD: ${sd3.toFixed(4)}`);
        
        if (sd1 === 0 && sd2 === 0 && sd3 === 0) {
            printAndSave("ANOVA  -> All values identical. No variance.");
        } else {
            const anova = oneWayAnova(bfsD, dfsD, hypD);
            if (anova) {
                const sig = anova.f > 3.1 ? "SIGNIFICANT (p < 0.05)" : "NOT SIGNIFICANT";
                printAndSave(`ANOVA  -> F-Value: ${anova.f.toFixed(4)}`);
                printAndSave(`Result -> ${sig}`);
            }
        }
    }
});

// Finally, save everything to results.txt
fs.writeFileSync(outputFile, outputText.join('\n'), 'utf-8');
printAndSave('\n' + '='.repeat(70));
printAndSave(`✅ SUCCESS: All results have been automatically saved to: ${outputFile}`);
printAndSave('='.repeat(70) + '\n');
