export interface MapDefinition {
  id: string;
  label: string;
  icon: string;
  isRealWorld: boolean;
}

export type ScenarioRegistry = Record<string, MapDefinition[]>;

export const MAP_REGISTRY: ScenarioRegistry = {
  network: [
    { id: 'synthetic', label: 'Synthetic', icon: '🗺️', isRealWorld: false },
    { id: 'datacenter', label: 'Fat-Tree Datacenter', icon: '🌐', isRealWorld: true },
    { id: 'as733', label: 'AS-733 ISP', icon: '🛰️', isRealWorld: true },
  ],
  robotics: [
    { id: 'synthetic', label: 'Synthetic', icon: '🗺️', isRealWorld: false },
    { id: 'aws', label: 'AWS Warehouse', icon: '🤖', isRealWorld: true },
    { id: 'clinic', label: 'Clinic Building', icon: '🏥', isRealWorld: true },
  ],
  traffic: [
    { id: 'synthetic', label: 'Synthetic', icon: '🗺️', isRealWorld: false },
    { id: 'cabuyao', label: 'Cabuyao City', icon: '🌍', isRealWorld: true },
  ],
  evacuation: [
    { id: 'synthetic', label: 'Synthetic', icon: '🗺️', isRealWorld: false },
    { id: 'building', label: 'SM City Santa Rosa', icon: '🏢', isRealWorld: true },
    { id: 'city', label: 'City Emergency Grid', icon: '🚦', isRealWorld: true },
  ],
  gameai: [
    { id: 'synthetic', label: 'Synthetic', icon: '🗺️', isRealWorld: false },
  ]
};
