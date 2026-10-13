/**
 * Cisco Real-World Network Icon Utility
 * Handles mapping node types and identities to authentic Cisco network icons,
 * and caches transparent offscreen canvases for high-performance canvas rendering.
 */

export interface NetworkNodeRef {
  id: string;
  label?: string;
  type?: string;
}

// Icon file paths in /public/networkIcons/
export const CISCO_ICON_FILES = {
  isp: '/networkIcons/carrier routing system.jpg',
  router: '/networkIcons/router.jpg',
  layer3Switch: '/networkIcons/layer 3 switch.jpg',
  workgroupSwitch: '/networkIcons/workgroup switch.jpg',
  accessPoint: '/networkIcons/accesspoint.jpg',
  pc: '/networkIcons/pc.jpg',
  laptop: '/networkIcons/laptop.jpg',
  tablet: '/networkIcons/tablet.jpg',
  printer: '/networkIcons/printer.jpg',
  phone: '/networkIcons/cellular phone.jpg',
  fileServer: '/networkIcons/fileserver.jpg',
  cloud: '/networkIcons/carrier routing system.jpg',
  firewall: '/networkIcons/firewall.jpg',
} as const;

/**
 * Resolves the most accurate Cisco icon for a given network node.
 * Evaluates both the specific node type and label/id keywords (e.g. Printer, Laptop, Tablet, Access Switch).
 */
export function getCiscoIconPath(node: NetworkNodeRef): string | null {
  const id = (node.id || '').toLowerCase();
  const label = (node.label || '').toLowerCase();
  const type = (node.type || '').toLowerCase();

  // 1. Device identity overrides based on label/id
  if (label.includes('printer') || id.includes('printer')) {
    return CISCO_ICON_FILES.printer;
  }
  if (label.includes('laptop') || id.includes('laptop')) {
    return CISCO_ICON_FILES.laptop;
  }
  if (label.includes('tablet') || id.includes('tablet') || label.includes('ipad')) {
    return CISCO_ICON_FILES.tablet;
  }
  if (label.includes('smartphone') || label.includes('phone') || id.includes('phone')) {
    return CISCO_ICON_FILES.phone;
  }
  if (label.includes('isp') || id.includes('isp')) {
    return CISCO_ICON_FILES.isp;
  }
  if (label.includes('firewall') || id.includes('firewall')) {
    return CISCO_ICON_FILES.firewall;
  }

  // 2. Switches: Distinguish Layer 3 (Core/Distribution) vs Layer 2 (Workgroup/Access)
  const isAccessSwitch = 
    type === 'access_switch' || 
    type === 'switch' || 
    id.startsWith('acc_') || 
    (label.endsWith('-sw') && !label.includes('mlt') && !label.includes('dist') && !label.includes('core')) ||
    label.startsWith('sw') || 
    label.startsWith('s0') || 
    label.startsWith('s1');

  if (isAccessSwitch) {
    return CISCO_ICON_FILES.workgroupSwitch;
  }

  const isMultilayerSwitch = 
    type === 'multilayer_switch' || 
    type === 'floor_router' ||
    id.includes('mlt') || 
    id.includes('dist') || 
    label.includes('mlt') || 
    label.includes('dist');

  if (isMultilayerSwitch) {
    return CISCO_ICON_FILES.layer3Switch;
  }

  // 3. ISP / Datacenter vs Routers
  if (type === 'datacenter' || type === 'isp' || type === 'cloud') {
    return CISCO_ICON_FILES.isp;
  }
  if (type === 'building_router' || type === 'router' || id.includes('router') || label.includes('router') || label.includes('core-r')) {
    return CISCO_ICON_FILES.router;
  }

  // 4. Wireless APs
  if (type === 'wireless_ap' || type === 'access_point' || id.includes('ap') || label.includes(' ap')) {
    return CISCO_ICON_FILES.accessPoint;
  }

  // 5. Servers
  if (type === 'server' || id.includes('server') || label.includes('server') || label.includes('dns') || label.includes('email') || label.includes('web')) {
    return CISCO_ICON_FILES.fileServer;
  }

  // 6. Generic End Devices (Default to PC)
  if (type === 'end_device' || id.includes('pc') || label.includes('pc')) {
    return CISCO_ICON_FILES.pc;
  }

  return null;
}

/**
 * Returns Cisco icon path by abstract node type
 */
export function getCiscoIconByNodeType(type: string): string | null {
  switch (type) {
    case 'datacenter':
    case 'isp':
      return CISCO_ICON_FILES.isp;
    case 'building_router':
    case 'router':
      return CISCO_ICON_FILES.router;
    case 'multilayer_switch':
    case 'floor_router':
      return CISCO_ICON_FILES.layer3Switch;
    case 'access_switch':
    case 'switch':
      return CISCO_ICON_FILES.workgroupSwitch;
    case 'wireless_ap':
    case 'access_point':
      return CISCO_ICON_FILES.accessPoint;
    case 'server':
      return CISCO_ICON_FILES.fileServer;
    case 'end_device':
      return CISCO_ICON_FILES.pc;
    default:
      return null;
  }
}

// In-memory cache for transparent offscreen canvases and data URLs
const canvasCache = new Map<string, HTMLCanvasElement>();
const dataUrlCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<HTMLCanvasElement | null>>();
const listeners = new Set<() => void>();

export function onCiscoIconsChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach(cb => {
    try { cb(); } catch (err) { console.error('Error in Cisco icon listener:', err); }
  });
}

/**
 * Loads an image from URL, converts its white/near-white background to transparent,
 * and caches the resulting HTMLCanvasElement.
 */
export function loadTransparentCiscoCanvas(src: string): Promise<HTMLCanvasElement | null> {
  if (canvasCache.has(src)) {
    return Promise.resolve(canvasCache.get(src)!);
  }
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }

  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  const promise = new Promise<HTMLCanvasElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const off = document.createElement('canvas');
        off.width = img.naturalWidth || img.width;
        off.height = img.naturalHeight || img.height;
        const ctx = off.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, off.width, off.height);
        const data = imgData.data;

        // Chroma-key near-white pixels with anti-aliased edge feathering
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 230 && g > 230 && b > 230) {
            const diff = Math.min(255 - r, 255 - g, 255 - b);
            if (diff < 10) {
              data[i + 3] = 0; // pure transparent
            } else {
              // Smooth transition for soft anti-aliased edges
              data[i + 3] = Math.max(0, Math.min(255, Math.round((25 - diff) / 25 * 255)));
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        canvasCache.set(src, off);
        dataUrlCache.set(src, off.toDataURL());
        notifyListeners();
        resolve(off);
      } catch (err) {
        console.warn('Failed to process transparent Cisco icon:', src, err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load Cisco icon image:', src);
      resolve(null);
    };
    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
}

/**
 * Synchronously retrieves the cached transparent canvas for CanvasRenderingContext2D.
 * Automatically initiates loading in the background if not yet cached.
 */
export function getCiscoIconCanvas(src: string, onLoaded?: () => void): HTMLCanvasElement | null {
  if (canvasCache.has(src)) {
    return canvasCache.get(src)!;
  }
  loadTransparentCiscoCanvas(src).then(() => {
    if (onLoaded) onLoaded();
  });
  return null;
}

/**
 * Returns a transparent data URL for HTML <img> rendering.
 * Falls back to the original src while the transparent version is processing.
 */
export function getCiscoIconDataUrl(src: string): string {
  if (dataUrlCache.has(src)) {
    return dataUrlCache.get(src)!;
  }
  loadTransparentCiscoCanvas(src);
  return src;
}

// Automatically preload common network icons in the browser
if (typeof window !== 'undefined') {
  Object.values(CISCO_ICON_FILES).forEach(url => {
    loadTransparentCiscoCanvas(url);
  });
}
