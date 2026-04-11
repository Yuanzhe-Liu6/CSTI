import { useRef, useState } from 'react';

const W = 1080;
const H = 1350;

const MARGIN = 72;
const INNER_W = W - 2 * MARGIN;

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
 * Wrap text for canvas; x is the **left** edge of each line.
 * Forces left alignment (caller may have left textAlign as `center` from earlier draws).
 * Returns y baseline after last line + lineHeight gap.
 */
function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

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

  ctx.restore();
  return cy + lineHeight;
}

function drawRadar(ctx, cx, cy, radius, normalized) {
  const n = DIMS.length;
  const step = (Math.PI * 2) / n;

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * step;
      const px = cx + Math.cos(a) * (radius * r) / 4;
      const py = cy + Math.sin(a) * (radius * r) / 4;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    const v = normalized[DIMS[i]] ?? 0.5;
    const px = cx + Math.cos(a) * radius * v;
    const py = cy + Math.sin(a) * radius * v;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(245, 166, 35, 0.35)';
  ctx.fill();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = COLORS.accent;
  ctx.font = '700 26px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelR = radius + 28;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.fillText(DIMS[i], cx + Math.cos(a) * labelR, cy + Math.sin(a) * labelR);
  }
}

/** Rough line count for strip height (same char-wrap rules as drawWrapped). */
function estimateWrappedLines(ctx, text, maxWidth) {
  ctx.save();
  ctx.font = '500 21px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  let lines = 1;
  let line = '';
  for (const ch of [...text]) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines += 1;
      line = ch;
    } else {
      line = test;
    }
  }
  ctx.restore();
  return lines;
}

function renderPoster(ctx, result) {
  const { typeCode, archetype, raw, normalized, personalRoasts } = result;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W / 2, 56, 0, W / 2, 56, 720);
  grad.addColorStop(0, 'rgba(245, 166, 35, 0.18)');
  grad.addColorStop(1, 'rgba(245, 166, 35, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(MARGIN, MARGIN, 80, 8);

  ctx.fillStyle = COLORS.text;
  ctx.font = '800 38px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CSTI', MARGIN, 118);

  ctx.fillStyle = COLORS.mute;
  ctx.font = '500 22px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('COUNTER-STRIKE TYPE INDICATOR', MARGIN + 105, 116);

  ctx.textAlign = 'center';
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.dim;
  ctx.font = '600 36px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('我的 CSTI 类型', W / 2, 230);

  ctx.shadowColor = 'rgba(245, 166, 35, 0.45)';
  ctx.shadowBlur = 50;
  ctx.fillStyle = COLORS.accent;
  ctx.font = '900 200px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText(typeCode, W / 2, 420);
  ctx.shadowBlur = 0;

  let nextY = 458;

  if (archetype) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '800 64px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(archetype.title, W / 2, nextY);
    nextY += 72;

    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 28px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(`代表人物：${archetype.pro}`, W / 2, nextY);
    nextY += 72;

    ctx.fillStyle = COLORS.text;
    ctx.font = '400 26px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    nextY = drawWrapped(ctx, archetype.tagline, MARGIN, nextY, INNER_W, 38);

    nextY += 12;
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'italic 500 26px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    nextY = drawWrapped(ctx, `“${archetype.roast}”`, MARGIN, nextY, INNER_W, 38);
  }

  const vizGap = 36;
  const vizTop = nextY + vizGap;
  const radarR = 148;
  const radarCx = MARGIN + radarR + 8;
  const radarCy = vizTop + radarR;

  drawRadar(ctx, radarCx, radarCy, radarR, normalized);

  const barX = radarCx + radarR + 56;
  const barW = W - MARGIN - barX;
  let barY = vizTop + 4;

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.dim;
  ctx.font = '600 20px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText('AXIS DOMINANCE', barX, barY);
  barY += 28;

  for (const [a, b, labelA, labelB] of AXIS_PAIRS) {
    const dom = normalized[a] ?? 0.5;
    const pct = Math.round(dom * 100);

    ctx.fillStyle = COLORS.text;
    ctx.font = '700 21px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${labelA} ${raw[a]}`, barX, barY);
    ctx.textAlign = 'right';
    ctx.fillText(`${raw[b]} ${labelB}`, barX + barW, barY);
    barY += 13;

    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.fillRect(barX, barY, barW, 13);
    ctx.strokeRect(barX, barY, barW, 13);

    const bg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    bg.addColorStop(0, COLORS.accent);
    bg.addColorStop(1, COLORS.accentHot);
    ctx.fillStyle = bg;
    ctx.fillRect(barX, barY, (barW * pct) / 100, 13);

    barY += 46;
  }

  const radarBottom = radarCy + radarR + 24;
  const barsBottom = barY + 8;
  const stripTop = Math.max(radarBottom, barsBottom) + 28;

  const footerY = H - MARGIN;
  const stripPad = 22;
  const headerBlockH = 52;
  const roastLineH = 28;
  const wrapW = INNER_W - 2 * stripPad;

  let roasts = personalRoasts?.length ? personalRoasts.slice(0, 3) : [];

  function measureStripHeight(count) {
    const slice = personalRoasts.slice(0, count);
    if (!slice.length) return 0;
    ctx.font = '500 21px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    let h = stripPad + headerBlockH + 10;
    for (const line of slice) {
      h += estimateWrappedLines(ctx, `· ${line}`, wrapW) * roastLineH;
    }
    return h + stripPad;
  }

  while (roasts.length > 0 && stripTop + measureStripHeight(roasts.length) > footerY - 6) {
    roasts = roasts.slice(0, -1);
  }

  const stripH = roasts.length ? measureStripHeight(roasts.length) : 0;
  const stripY = stripTop;

  if (roasts.length && stripH > 0) {
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.border;
    ctx.fillRect(MARGIN, stripY, INNER_W, stripH);
    ctx.strokeRect(MARGIN, stripY, INNER_W, stripH);

    ctx.fillStyle = COLORS.text;
    ctx.font = '700 19px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('深度行为解析', MARGIN + stripPad, stripY + stripPad + 20);

    ctx.fillStyle = COLORS.dim;
    ctx.font = '600 14px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('DEEP BEHAVIOR', MARGIN + stripPad, stripY + stripPad + 42);

    let py = stripY + stripPad + headerBlockH;
    ctx.fillStyle = COLORS.text;
    ctx.font = '500 21px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    for (const line of roasts) {
      py = drawWrapped(ctx, `· ${line}`, MARGIN + stripPad, py, wrapW, roastLineH);
    }
  }

  ctx.fillStyle = COLORS.mute;
  ctx.font = '500 19px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('csti · v0.1 · share your type', W / 2, footerY);
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
        {generating ? '生成中…' : '下载海报'}
      </button>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
