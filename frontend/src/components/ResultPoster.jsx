import { useRef, useState } from 'react';
import QRCode from 'qrcode';

const W = 1080;
const H = 1350;

const MARGIN = 72;
const INNER_W = W - 2 * MARGIN;

/**
 * 雷达略小于早期版本；缩小半径时增大与条形区的间距，使 BAR_X 不变、与右侧标题列对齐。
 * 关系：BAR_X = MARGIN + 2*R + PAD + GAP，令 GAP = 56 + 2*(R_REF - R)。
 */
const RADAR_R_REF = 148;
const RADAR_R = 138;
const RADAR_PAD = 8;
const RADAR_TO_BAR_GAP = 56 + 2 * (RADAR_R_REF - RADAR_R);
const RADAR_CX = MARGIN + RADAR_R + RADAR_PAD;
/** 四轴分数（AXIS DOMINANCE）条形区域左缘；右侧标题列与之对齐 */
const BAR_X = RADAR_CX + RADAR_R + RADAR_TO_BAR_GAP;
const PHOTO_SIZE = 2 * RADAR_R;
/** 与雷达圆外接正方形同宽，左缘与雷达圆左切线对齐 */
const PHOTO_LEFT = RADAR_CX - RADAR_R;
/** 主标题区（含选手图）底部与标语/金句之间的留白 */
const HERO_TO_DESC_GAP = 64;

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

const HERO_TOP = 188;

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} result
 * @param {{ quizUrl: string }} opts
 */
async function renderPoster(ctx, result, { quizUrl }) {
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

  const hasPhoto = Boolean(archetype?.pro);
  let proImg = null;
  if (hasPhoto) {
    const src = `/archetypes/${archetype.pro}.webp`;
    try {
      proImg = await loadImage(src);
    } catch {
      proImg = null;
    }
  }

  const photoLeft = PHOTO_LEFT;
  const textLeft = proImg ? BAR_X : MARGIN;

  /** 右侧标题列用 top 基线堆叠，便于与左侧照片做垂直居中（字号与早期海报一致） */
  const eyebrowFont = '600 36px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  const codeFont = '900 118px ui-monospace, Menlo, Consolas, monospace';
  const titleFont = '800 64px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  const proFont = '500 28px ui-monospace, Menlo, Consolas, monospace';

  let textStackH = 44 + 8 + 122;
  if (archetype) {
    textStackH += 12 + 72 + 10 + 36;
  }

  const heroBandH = proImg ? Math.max(PHOTO_SIZE, textStackH) : textStackH;
  const heroBandTop = HERO_TOP;
  const photoY = proImg ? heroBandTop + (heroBandH - PHOTO_SIZE) / 2 : heroBandTop;
  const textColumnTop = heroBandTop + (heroBandH - textStackH) / 2;

  if (proImg) {
    const r = 18;
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(photoLeft, photoY, PHOTO_SIZE, PHOTO_SIZE, r);
    } else {
      ctx.moveTo(photoLeft + r, photoY);
      ctx.arcTo(photoLeft + PHOTO_SIZE, photoY, photoLeft + PHOTO_SIZE, photoY + PHOTO_SIZE, r);
      ctx.arcTo(photoLeft + PHOTO_SIZE, photoY + PHOTO_SIZE, photoLeft, photoY + PHOTO_SIZE, r);
      ctx.arcTo(photoLeft, photoY + PHOTO_SIZE, photoLeft, photoY, r);
      ctx.arcTo(photoLeft, photoY, photoLeft + PHOTO_SIZE, photoY, r);
      ctx.closePath();
    }
    ctx.clip();
    const iw = proImg.width;
    const ih = proImg.height;
    const scale = Math.max(PHOTO_SIZE / iw, PHOTO_SIZE / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = photoLeft + (PHOTO_SIZE - dw) / 2;
    const dy = photoY + (PHOTO_SIZE - dh) / 2;
    ctx.drawImage(proImg, dx, dy, dw, dh);
    ctx.restore();

    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(photoLeft, photoY, PHOTO_SIZE, PHOTO_SIZE, r);
    } else {
      ctx.rect(photoLeft, photoY, PHOTO_SIZE, PHOTO_SIZE);
    }
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let ty = textColumnTop;

  ctx.fillStyle = COLORS.dim;
  ctx.font = eyebrowFont;
  ctx.fillText('我的 CSTI 类型', textLeft, ty);
  ty += 44 + 8;

  ctx.shadowColor = 'rgba(245, 166, 35, 0.35)';
  ctx.shadowBlur = 36;
  ctx.fillStyle = COLORS.accent;
  ctx.font = codeFont;
  ctx.fillText(typeCode, textLeft, ty);
  ctx.shadowBlur = 0;
  ty += 122;

  if (archetype) {
    ty += 12;
    ctx.fillStyle = COLORS.text;
    ctx.font = titleFont;
    ctx.fillText(archetype.title, textLeft, ty);
    ty += 72 + 10;

    ctx.fillStyle = COLORS.dim;
    ctx.font = proFont;
    ctx.fillText(`代表人物：${archetype.pro}`, textLeft, ty);
  }

  const heroBottom = heroBandTop + heroBandH;
  let nextY = heroBottom + HERO_TO_DESC_GAP;

  if (archetype) {
    ctx.fillStyle = COLORS.text;
    ctx.font = '400 26px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    nextY = drawWrapped(ctx, archetype.tagline, MARGIN, nextY, INNER_W, 38);

    nextY += 12;
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'italic 500 26px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    nextY = drawWrapped(ctx, `“${archetype.roast}”`, MARGIN, nextY, INNER_W, 38);
  }

  /** 底部二维码（不占轴线区横向宽度） */
  const qrSize = 84;
  /** 二维码下缘与「扫码测试」文案之间的间距 */
  const qrCaptionGap = 14;

  const vizGap = 36;
  const vizTop = nextY + vizGap;
  const radarCx = RADAR_CX;
  const radarR = RADAR_R;
  const radarCy = vizTop + radarR;

  drawRadar(ctx, radarCx, radarCy, radarR, normalized);

  const barX = BAR_X;
  const barW = W - MARGIN - barX;
  let barY = vizTop + 4;

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.dim;
  ctx.font = '600 20px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText('AXIS DOMINANCE', barX, barY);
  barY += 28;

  for (const [a, b, labelA, labelB] of AXIS_PAIRS) {
    const na = normalized[a] ?? 0.5;
    const nb = normalized[b] ?? 0.5;
    const dominant = na >= nb ? a : b;
    const loser = dominant === a ? b : a;
    const labelDom = dominant === a ? labelA : labelB;
    const labelLoser = dominant === a ? labelB : labelA;
    const pct = Math.round((dominant === a ? na : nb) * 100);

    ctx.fillStyle = COLORS.text;
    ctx.font = '700 21px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${labelDom} ${raw[dominant]}`, barX, barY);
    ctx.textAlign = 'right';
    ctx.fillText(`${raw[loser]} ${labelLoser}`, barX + barW, barY);
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

  const qrCaptionH = 22;
  const qrBlockH = qrSize + 8 + qrCaptionGap + qrCaptionH + 10;
  const footerY = H - MARGIN;
  const stripFooterLimit = footerY - qrBlockH - 10;

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

  while (roasts.length > 0 && stripTop + measureStripHeight(roasts.length) > stripFooterLimit - 6) {
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

  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, quizUrl, {
    width: qrSize,
    margin: 1,
    color: { dark: '#0b0b0d', light: '#ffffff' },
  });

  const qrX = W - MARGIN - qrSize;
  const qrY = footerY - qrBlockH;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
  ctx.drawImage(qrCanvas, qrX, qrY);

  ctx.fillStyle = COLORS.dim;
  ctx.font = '500 18px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('扫码测试', qrX + qrSize / 2, qrY + qrSize + qrCaptionGap);
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
      const quizUrl = `${window.location.origin}/`;
      await renderPoster(ctx, result, { quizUrl });

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
