import { BaseRenderer, RenderOptions } from '../../BaseRenderer';

export class NetworkRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    const { ctx, scenario, mapId, scale } = options;

    if (scenario === 'network' && mapId === 'companybusiness') {
      ctx.save();
      const layers = [
        { label: 'Core Layer', color: '#db2777', cx: 1300, cy: 220, rx: 450, ry: 70 },
        { label: 'Distribution Layer', color: '#06b6d4', cx: 1300, cy: 400, rx: 750, ry: 110 }
      ];

      layers.forEach(layer => {
        ctx.fillStyle = this.getRgba(layer.color, 0.15);
        ctx.strokeStyle = this.getRgba(layer.color, 0.4);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(this.sx(layer.cx, options), this.sy(layer.cy, options), layer.rx * scale, layer.ry * scale, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        const boxWidth = 140;
        const boxHeight = 30;
        const labelX = this.sx(layer.cx + layer.rx, options) - boxWidth; 
        const labelY = this.sy(layer.cy, options);

        ctx.fillStyle = '#991b1b'; 
        ctx.fillRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 14px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.label, labelX + boxWidth / 2, labelY);
      });
      ctx.restore();

      const floors = [
        { label: 'FIRST FLOOR (Sales & HR)', color: '#0f766e', rect: [100, 550, 800, 450] as const }, 
        { label: 'SECOND FLOOR (Finance & Admin)', color: '#1d4ed8', rect: [950, 550, 800, 450] as const }, 
        { label: 'THIRD FLOOR (ICT & Server Room)', color: '#7e22ce', rect: [1800, 550, 700, 450] as const }, 
      ];

      ctx.save();
      floors.forEach(floor => {
        const [x, y, w, h] = floor.rect;
        ctx.fillStyle = this.getRgba(floor.color, 0.15);
        ctx.strokeStyle = this.getRgba(floor.color, 0.4);
        ctx.lineWidth = 2; 
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(this.sx(x, options), this.sy(y, options), w * scale, h * scale, 16);
        } else {
          ctx.rect(this.sx(x, options), this.sy(y, options), w * scale, h * scale);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.getRgba(floor.color, 0.9);
        ctx.font = `bold 16px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(floor.label, this.sx(x + 20, options), this.sy(y + 20, options));
      });
      ctx.restore();
    }

    if (scenario === 'network' && mapId === 'campus') {
      ctx.save();
      const serverCenter = { label: 'Server Center', color: '#3b82f6', cx: 1300, cy: 300, rx: 280, ry: 150 };

      ctx.fillStyle = this.getRgba(serverCenter.color, 0.15);
      ctx.strokeStyle = this.getRgba(serverCenter.color, 0.4);
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.ellipse(this.sx(serverCenter.cx, options), this.sy(serverCenter.cy, options), serverCenter.rx * scale, serverCenter.ry * scale, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      const boxWidth = 140;
      const boxHeight = 30;
      const labelX = this.sx(serverCenter.cx, options) - boxWidth / 2; 
      const labelY = this.sy(serverCenter.cy - serverCenter.ry, options);

      ctx.fillStyle = '#1e3a8a'; 
      ctx.fillRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 14px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(serverCenter.label, labelX + boxWidth / 2, labelY);
      ctx.restore();

      const blocks = [
        { label: 'BOYS BLOCK', color: '#ea580c', rect: [250, 100, 550, 350] as const }, 
        { label: 'GIRLS BLOCK', color: '#ea580c', rect: [250, 750, 550, 350] as const }, 
        { label: 'AB1', color: '#ea580c', rect: [1600, 100, 550, 350] as const }, 
        { label: 'AB2', color: '#ea580c', rect: [2250, 100, 550, 350] as const }, 
        { label: 'IT CONSULTING', color: '#eab308', rect: [1450, 750, 400, 350] as const }, 
        { label: 'LIBRARY', color: '#eab308', rect: [1900, 750, 400, 350] as const }, 
        { label: 'DOME AREA', color: '#eab308', rect: [2350, 750, 500, 350] as const }, 
      ];

      ctx.save();
      blocks.forEach(block => {
        const [x, y, w, h] = block.rect;
        ctx.fillStyle = this.getRgba(block.color, 0.15);
        ctx.strokeStyle = this.getRgba(block.color, 0.4);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(this.sx(x, options), this.sy(y, options), w * scale, h * scale, 16);
        } else {
          ctx.rect(this.sx(x, options), this.sy(y, options), w * scale, h * scale);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.getRgba(block.color, 0.9);
        ctx.font = `bold 16px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(block.label, this.sx(x + 20, options), this.sy(y + 20, options));
      });
      ctx.restore();
    }
  }
}
