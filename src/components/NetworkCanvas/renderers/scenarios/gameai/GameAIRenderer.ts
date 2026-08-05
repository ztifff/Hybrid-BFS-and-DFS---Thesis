import { BaseRenderer, RenderOptions } from '../../BaseRenderer';

export class GameAIRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    const { ctx, visibleNodes, zoom } = options;

    const boardNodes = visibleNodes.filter(node => typeof node.metadata?.board === 'string' && node.metadata.board !== 'arena');
    const boards = Array.from(new Set(boardNodes.map(node => node.metadata?.board as string)));

    boards.forEach(board => {
      const group = boardNodes.filter(node => node.metadata?.board === board);
      if (group.length === 0) return;

      const xs = group.map(node => this.sx(node.x, options));
      const ys = group.map(node => this.sy(node.y, options));
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const uniqueX = Array.from(new Set(xs.map(value => Math.round(value)))).sort((a, b) => a - b);
      const uniqueY = Array.from(new Set(ys.map(value => Math.round(value)))).sort((a, b) => a - b);
      const dx = uniqueX.length > 1 ? uniqueX[1] - uniqueX[0] : 38;
      const dy = uniqueY.length > 1 ? uniqueY[1] - uniqueY[0] : 38;
      const tileSize = Math.min(dx, dy) * 0.92;

      ctx.save();
      ctx.globalAlpha = 0.78;

      if (board === 'checkers') {
        const stepX = uniqueX.length > 1 ? uniqueX[1] - uniqueX[0] : tileSize;
        const stepY = uniqueY.length > 1 ? uniqueY[1] - uniqueY[0] : tileSize;
        const startX = minX - tileSize / 2;
        const startY = minY - tileSize / 2;

        const boardSize = Math.max(uniqueX.length, uniqueY.length, 1);

        for (let row = 0; row < boardSize; row++) {
          for (let col = 0; col < boardSize; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#111827' : '#991b1b';
            ctx.fillRect(startX + col * stepX, startY + row * stepY, tileSize, tileSize);
          }
        }
      } else {
        group.forEach(node => {
          const row = Number(node.metadata?.row ?? 0);
          const col = Number(node.metadata?.col ?? 0);
          const cx = this.sx(node.x, options);
          const cy = this.sy(node.y, options);

          if (board === 'dama') {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#d4a96a' : '#6b3a1f';
          } else {
            const palette = ['#14532d', '#0f766e', '#1d4ed8', '#7c2d12'];
            ctx.fillStyle = palette[(row + col) % palette.length];
          }

          ctx.fillRect(cx - tileSize / 2, cy - tileSize / 2, tileSize, tileSize);
        });
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = board === 'checkers' ? '#f87171' : board === 'dama' ? '#d4a96a' : '#fde68a';
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeRect(
        minX - tileSize / 2,
        minY - tileSize / 2,
        (maxX - minX) + tileSize,
        (maxY - minY) + tileSize
      );

      ctx.font = `bold ${14 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeStyle = '#0a0f1e';
      ctx.fillStyle = '#f8fafc';
      const boardTitle = board === 'snakes' ? 'Snakes & Ladders' : board[0].toUpperCase() + board.slice(1);
      const titleX = minX + ((maxX - minX) / 2);
      const titleY = minY - (tileSize * 0.9);
      ctx.strokeText(boardTitle, titleX, titleY);
      ctx.fillText(boardTitle, titleX, titleY);
      ctx.restore();
    });
  }
}
