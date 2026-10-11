import { BaseRenderer, RenderOptions } from '../../BaseRenderer';

export class NetworkRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    const { ctx, scenario, mapId, scale } = options;

    if (scenario === 'network' && mapId === 'companybusiness') {
      // Always draw Core and Distribution layers as they are logical architecture concepts
      ctx.save();
      const layers = [
        { label: 'Core Layer', color: '#db2777', cx: 1300, cy: 220, rx: 450, ry: 70 },
        { label: 'Distribution Layer', color: '#06b6d4', cx: 1300, cy: 400, rx: 750, ry: 110 }
      ];

      layers.forEach((layer, i) => {
        ctx.fillStyle = this.getRgba(layer.color, 0.15);
        ctx.strokeStyle = this.getRgba(layer.color, 0.4);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(this.sx(layer.cx, options), this.sy(layer.cy, options), layer.rx * scale, layer.ry * scale, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        const boxWidth = 150;
        const boxHeight = 24;
        const labelX = i === 0
          ? this.sx(layer.cx + layer.rx, options) + 6
          : this.sx(layer.cx + layer.rx, options) - boxWidth - 8;
        const labelY = this.sy(layer.cy, options) - boxHeight / 2;

        const bgColor = i === 0 ? '#881337' : '#164e63';
        ctx.fillStyle = bgColor;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(labelX, labelY, boxWidth, boxHeight, 5);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillRect(labelX, labelY, boxWidth, boxHeight);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 12px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.label, labelX + boxWidth / 2, labelY + boxHeight / 2);
      });
      ctx.restore();

      if (options.workspaceView === 'logical') {
        // Draw Logical VLAN Groupings instead of Physical floors
        ctx.save();
        const vlans = [
          { label: 'VLAN 10: Sales', color: '#0ea5e9', cx: 300, cy: 690, rx: 160, ry: 140 },
          { label: 'VLAN 20: HR', color: '#10b981', cx: 700, cy: 690, rx: 160, ry: 140 },
          { label: 'VLAN 30: Finance', color: '#f59e0b', cx: 1100, cy: 690, rx: 160, ry: 140 },
          { label: 'VLAN 40: Admin', color: '#ec4899', cx: 1500, cy: 690, rx: 160, ry: 140 },
          { label: 'VLAN 50: ICT', color: '#8b5cf6', cx: 1900, cy: 690, rx: 160, ry: 140 },
          { label: 'VLAN 80: Servers', color: '#f43f5e', cx: 2300, cy: 690, rx: 160, ry: 140 },
        ];

        vlans.forEach((vlan) => {
          ctx.fillStyle = this.getRgba(vlan.color, 0.05);
          ctx.strokeStyle = this.getRgba(vlan.color, 0.4);
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.ellipse(this.sx(vlan.cx, options), this.sy(vlan.cy, options), vlan.rx * scale, vlan.ry * scale, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Subnet label at the bottom
          ctx.fillStyle = this.getRgba(vlan.color, 0.9);
          ctx.font = `bold 12px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(vlan.label, this.sx(vlan.cx, options), this.sy(vlan.cy + vlan.ry - 20, options));
        });
        
        ctx.restore();
      } else {
        // Physical View: Draw Floors
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
    }

    if (scenario === 'network' && mapId === 'campus') {
      if (options.workspaceView === 'logical') {
        // Logical Subnets for Campus
        ctx.save();
        const subnets = [
          { label: 'Server Subnet (192.168.10.x)', color: '#3b82f6', cx: 1300, cy: 300, rx: 280, ry: 150 },
          { label: 'Boys Block Subnet (192.168.3.6-9)', color: '#0ea5e9', cx: 500, cy: 250, rx: 350, ry: 200 },
          { label: 'Girls Block Subnet (192.168.3.2-5)', color: '#ec4899', cx: 500, cy: 950, rx: 350, ry: 200 },
          { label: 'AB1 Subnet (192.168.1.14-17)', color: '#10b981', cx: 1850, cy: 250, rx: 350, ry: 200 },
          { label: 'AB2 Subnet (192.168.1.10-13)', color: '#8b5cf6', cx: 2450, cy: 250, rx: 350, ry: 200 },
          { label: 'AB3 Subnet (192.168.1.2-9)', color: '#f59e0b', cx: 2150, cy: 950, rx: 700, ry: 250 },
        ];

        subnets.forEach((subnet) => {
          ctx.fillStyle = this.getRgba(subnet.color, 0.05);
          ctx.strokeStyle = this.getRgba(subnet.color, 0.4);
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.ellipse(this.sx(subnet.cx, options), this.sy(subnet.cy, options), subnet.rx * scale, subnet.ry * scale, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = this.getRgba(subnet.color, 0.9);
          ctx.font = `bold 12px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(subnet.label, this.sx(subnet.cx, options), this.sy(subnet.cy - subnet.ry + 20, options));
        });
        
        ctx.restore();
      } else {
        // Physical View for Campus
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
      } // end else for physical view
    }
  }
}
