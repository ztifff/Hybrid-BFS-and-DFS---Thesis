import os
import json
# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
from scipy import stats

def analyze_exported_data(data_folder="data"):
    all_data = []
    
    # Read all JSON files in the data folder
    for filename in os.listdir(data_folder):
        if filename.endswith(".json"):
            filepath = os.path.join(data_folder, filename)
            with open(filepath, 'r') as f:
                try:
                    entries = json.load(f)
                    for entry in entries:
                        # Extract the metrics for each algorithm
                        if "multiResults" in entry:
                            multi = entry["multiResults"]
                            
                            row = {
                                "scenario": entry.get("scenario", "Unknown"),
                                "runNumber": entry.get("runNumber", 0),
                            }
                            
                            for algo in ["bfs", "dfs", "hybrid"]:
                                if algo in multi:
                                    metrics = multi[algo].get("metrics", {})
                                    row[f"{algo}_time"] = metrics.get("timeElapsed", 0)
                                    row[f"{algo}_nodes"] = metrics.get("nodesExplored", 0)
                                    row[f"{algo}_path"] = metrics.get("pathLength", 0)
                                    row[f"{algo}_memory"] = metrics.get("memoryUsed", 0)
                                    row[f"{algo}_completion"] = metrics.get("completionRate", 0)
                            
                            all_data.append(row)
                except Exception as e:
                    print(f"Error reading {filename}: {e}")

    if not all_data:
        print("No valid data found. Please drop your exported JSON files into the 'data' folder.")
        return

    df = pd.DataFrame(all_data)
    
    metrics = ["time", "nodes", "path", "memory", "completion"]
    
    print("\n" + "="*50)
    print("STATISTICAL ANALYSIS RESULTS (CHAPTER 4)")
    print("="*50)
    
    for metric in metrics:
        print(f"\n--- Metric: {metric.upper()} ---")
        
        bfs_data = df[f"bfs_{metric}"].dropna().values
        dfs_data = df[f"dfs_{metric}"].dropna().values
        hybrid_data = df[f"hybrid_{metric}"].dropna().values
        
        # Print Descriptive Statistics
        print(f"BFS    -> Mean: {np.mean(bfs_data):.2f}, SD: {np.std(bfs_data):.2f}")
        print(f"DFS    -> Mean: {np.mean(dfs_data):.2f}, SD: {np.std(dfs_data):.2f}")
        print(f"Hybrid -> Mean: {np.mean(hybrid_data):.2f}, SD: {np.std(hybrid_data):.2f}")
        
        # Run One-Way ANOVA
        if len(bfs_data) > 1 and len(dfs_data) > 1 and len(hybrid_data) > 1:
            f_val, p_val = stats.f_oneway(bfs_data, dfs_data, hybrid_data)
            print(f"ANOVA  -> F-Value: {f_val:.4f}, p-Value: {p_val:.4f}")
            if p_val < 0.05:
                print("Result -> SIGNIFICANT DIFFERENCE (p < 0.05)")
            else:
                print("Result -> NO SIGNIFICANT DIFFERENCE (p >= 0.05)")
        else:
            print("Not enough data points to run ANOVA (need at least 2 runs).")

if __name__ == "__main__":
    analyze_exported_data()
