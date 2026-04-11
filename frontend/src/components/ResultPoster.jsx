import { useRef, useState } from 'react';

const W = 1080;
const H = 1350;

const COLORS = {
  bg: '#0b0b0d',
  panel: '#15151a',
  border: '#2a2a33',
  text: '#f2f2f5',
  dim: '#9a9aa5',
  mute: '#5e5e6b',
  accent: '#f5a623',
  accentHot: '#ffb733',
};

const AXIS_PAIRS = [
  ['P', 'R', 'Proactive', 'Reactive'],
  ['M', 'I', 'Mechanics', 'Intelligence'],
  ['E', 'U', 'Ego', 'Utility'],
  ['C', 'H', 'Chilled', 'Hyped'],
];

const DIMS = ['P', 'R', 'M', 'I', 'E', 'U', 'C', 'H'];

/**
 * Wrap text by measuring on the canvas context.
 * Returns the y after the last drawn line.
 */
function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = [...text];
  let line = '';
  let cy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, cy);
      cy += lineHeight;
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineHeight;
}

function drawRadar(ctx, cx, cy, radius, normalized) {
  const n = DIMS.length;
  const step = (Math.PI * 2) / n;

  // Concentric grid
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * step;
      const x = cx + Math.cos(a) * (radius * r) / 4;
      const y = cy + Math.sin(a) * (radius * r) / 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Spokes
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    const v = normalized[DIMS[i]] ?? 0.5;
    const x = cx + Math.cos(a) * radius * v;
    const y = cy + Math.sin(a) * radius * v;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(245, 166, 35, 0.35)';
  ctx.fill();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Dim labels
  ctx.fillStyle = COLORS.accent;
  ctx.font = '700 28px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    const x = cx + Math.cos(a) * (radius + 32);
    const y = cy + Math.sin(a) * (radius + 32);
    ctx.fillText(DIMS[i], x, y);
  }
}

function renderPoster(ctx, result) {
  const { typeCode, archetype, raw, normalized, personalRoasts } = result;

  // Background with subtle radial glow
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W / 2, 60, 0, W / 2, 60, 800);
  grad.addColorStop(0, 'rgba(245, 166, 35, 0.18)');
  grad.addColorStop(1, 'rgba(245, 166, 35, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Top border
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(60, 60, 80, 8);

  // Brand
  ctx.fillStyle = COLORS.text;
  ctx.font = '800 38px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CSTI', 60, 130);

  ctx.fillStyle = COLORS.mute;
  ctx.font = '500 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('COUNTER-STRIKE TYPE INDICATOR', 165, 128);

  // Type code (huge, glowing)
  ctx.shadowColor = 'rgba(245, 166, 35, 0.45)';
  ctx.shadowBlur = 50;
  ctx.fillStyle = COLORS.accent;
  ctx.font = '900 200px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(typeCode, W / 2, 360);
  ctx.shadowBlur = 0;

  // Archetype title
  if (archetype) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '800 70px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(archetype.title, W / 2, 460);

    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 32px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(`≈ ${archetype.pro}`, W / 2, 510);

    // Tagline (wrapped)
    ctx.fillStyle = COLORS.text;
    ctx.font = '400 28px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    drawWrapped(ctx, archetype.tagline, W / 2 - 420, 570, 840, 40);

    // Roast (wrapped, italic accent)
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'italic 500 28px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    drawWrapped(ctx, `"${archetype.roast}"`, W / 2 - 420, 645, 840, 40);
  }

  // Radar (left side)
  drawRadar(ctx, 280, 940, 170, normalized);

  // Right side: axis bars
  const barX = 540;
  const barW = 460;
  let barY = 800;

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.dim;
  ctx.font = '600 22px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText('AXIS DOMINANCE', barX, barY);
  barY += 30;

  for (const [a, b, , ] of AXIS_PAIRS) {
    const dom = normalized[a] ?? 0.5;
    const pct = Math.round(dom * 100);

    ctx.fillStyle = COLORS.text;
    ctx.font = '700 22px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${a} ${raw[a]}`, barX, barY);
    ctx.textAlign = 'right';
    ctx.fillText(`${raw[b]} ${b}`, barX + barW, barY);
    barY += 14;

    // Bar background
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.fillRect(barX, barY, barW, 14);
    ctx.strokeRect(barX, barY, barW, 14);

    // Bar fill (gradient)
    const bg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    bg.addColorStop(0, COLORS.accent);
    bg.addColorStop(1, COLORS.accentHot);
    ctx.fillStyle = bg;
    ctx.fillRect(barX, barY, (barW * pct) / 100, 14);

    barY += 50;
  }

  // Personal roasts (bottom strip)
  if (personalRoasts?.length) {
    const stripY = 1170;
    ctx.fillStyle = COLORS.panel;
    ctx.fillRect(60, stripY, W - 120, 110);
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(60, stripY, 6, 110);

    ctx.fillStyle = COLORS.dim;
    ctx.font = '600 18px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PERSONALIZED ROASTS', 90, stripY + 28);

    ctx.fillStyle = COLORS.text;
    ctx.font = '500 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    let py = stripY + 58;
    for (const line of personalRoasts.slice(0, 2)) {
      drawWrapped(ctx, `· ${line}`, 90, py, W - 180, 28);
      py += 30;
    }
  }

  // Footer
  ctx.fillStyle = COLORS.mute;
  ctx.font = '500 20px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('csti · v0.1 · share your type', W / 2, H - 40);
}

export default function ResultPoster({ result }) {
  const canvasRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const canvas = canvasRef.current;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      renderPoster(ctx, result);

      // Trigger download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `csti-${result.typeCode}-${result.id.slice(0, 8)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setGenerating(false);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={generate}
        disabled={generating}
      >
        {generating ? '生成中…' : '下载海报 / Poster'}
      </button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
