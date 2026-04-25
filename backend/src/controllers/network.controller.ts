import { Request, Response } from 'express';
import { ScenarioType as NetworkType } from '../types/index';
import { buildNetworkGraph } from '../utils/networkGraph';

// Stubs for missing functions in networkGraph.ts
const listNetworkTypes = () => ['datacenter', 'aws', 'traffic', 'evacuation', 'gameai', 'robotics', 'mockoffice'];
const getAllNetworkMeta = () => listNetworkTypes().map(type => ({ type, name: `${type} network` }));

export class NetworkController {
  listNetworks(_req: Request, res: Response): void {
    try {
      const meta = getAllNetworkMeta();
      res.status(200).json({ success: true, data: meta });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  getNetwork(req: Request, res: Response): void {
    try {
      const networkType = req.params.type as NetworkType;
      const validTypes = listNetworkTypes();
      if (!validTypes.includes(networkType)) {
        res.status(400).json({ success: false, error: `Unknown network type: ${networkType}` });
        return;
      }
      const graph = buildNetworkGraph(false, 123); 
      res.status(200).json({ success: true, data: graph });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  getNetworkMeta(req: Request, res: Response): void {
    try {
      const networkType = req.params.type as NetworkType;
      const all = getAllNetworkMeta();
      const meta = all.find((m) => m.type === networkType);
      if (!meta) {
        res.status(404).json({ success: false, error: `Network not found: ${networkType}` });
        return;
      }
      res.status(200).json({ success: true, data: meta });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }
}