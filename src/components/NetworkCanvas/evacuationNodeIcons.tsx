import React from 'react';

const EVACUATION_ICON_PATHS: Record<string, string> = {
  start: 'M3 20V5h18v15M3 15h18M5 15v-4h6v4M3 8h18M7 5v3m5-3v3m5-3v3',
  place: 'M3 10 12 4l9 6M5 9v11h14V9M9 20v-6h6v6M8 11h2m4 0h2',
  room: 'M5 21V4h14v17M9 21V8h8v13m-2-6h.01',
  cinema: 'M4 5h16v14H4zM4 9h16M8 5v4m8-4v4m-6 4 4 2-4 2z',
  emergency_exit: 'M4 3h11v18H4zM15 12h6m-3-3 3 3-3 3M8 8v.01',
  corridor: 'M15 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-2 5-3 4 5 2 2-4m-6-1-5 1-2 3m11-4 4-2m-9 8-2 5m4-5 5 3 2 3M2 7h3M1 10h3',
  stairwell: 'M3 20h5v-4h4v-4h4V8h5M3 20V8h5v4h4v4h4v4',
  fire: 'M12 22a7 7 0 0 0 7-7c0-4-3-6-3-10-2 2-3 3-3 5-2-2-3-4-3-7-4 4-6 8-5 12a7 7 0 0 0 7 7Zm0-3a3 3 0 0 0 3-3c0-1.5-1-2.5-2-3.5-.2 1.3-1 2-2 2.5-1-1-1-2-1-3-1.5 1.5-2 2.5-2 4a3 3 0 0 0 4 3Z',
  blocked: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 9h8',
};

const ICON_ASSETS: Record<string, string> = {
  start: '/EvacMaps/Icons/shopping-center.png',
  place: '/EvacMaps/Icons/shopping-basket.png',
  shop: '/EvacMaps/Icons/shopping-basket.png',
  amenity: '/EvacMaps/Icons/shopping-basket.png',
  restaurant: '/EvacMaps/Icons/fries-and-soft-drink.png',
  room: '/EvacMaps/Icons/dress-and-bag.png',
  stairwell: '/EvacMaps/Icons/stairs-with-handrail.png',
};

const loadedIconImages = new Map<string, HTMLImageElement>();
const iconListeners = new Set<() => void>();

export function onEvacuationIconsChange(callback: () => void) {
  iconListeners.add(callback);
  return () => iconListeners.delete(callback);
}

function getIconImage(type: string) {
  const src = ICON_ASSETS[type];
  if (!src || typeof Image === 'undefined') return null;
  const cached = loadedIconImages.get(src);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;

  const image = new Image();
  loadedIconImages.set(src, image);
  image.onload = () => iconListeners.forEach(listener => listener());
  image.onerror = () => loadedIconImages.delete(src);
  image.src = src;
  return null;
}

export function EvacuationNodeIcon({
  type,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  filter,
}: {
  type: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filter?: string;
}) {
  const image = ICON_ASSETS[type];
  if (image) {
    return <img src={image} width={size} height={size} alt="" aria-hidden="true" className="object-contain" style={{ filter }} />;
  }
  const d = EVACUATION_ICON_PATHS[type];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function drawEvacuationNodeIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  centerX: number,
  centerY: number,
  size: number,
  color = '#ffffff'
) {
  const image = getIconImage(type);
  if (image) {
    ctx.save();
    ctx.filter = 'invert(1)';
    ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
    ctx.restore();
    return true;
  }
  if (ICON_ASSETS[type]) return true;
  const d = EVACUATION_ICON_PATHS[type];
  if (!d || typeof Path2D === 'undefined') return false;
  ctx.save();
  ctx.translate(centerX - size / 2, centerY - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(d));
  ctx.restore();
  return true;
}
