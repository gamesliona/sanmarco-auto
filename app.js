const canvas = document.querySelector("#posterCanvas");
const ctx = canvas.getContext("2d");

const imageInput = document.querySelector("#imageInput");
const imageInput2 = document.querySelector("#imageInput2");
const captionInput = document.querySelector("#captionInput");
const textSizeInput = document.querySelector("#textSizeInput");
const textOffsetYInput = document.querySelector("#textOffsetYInput");
const lineHeightInput = document.querySelector("#lineHeightInput");
const zoomInput = document.querySelector("#zoomInput");
const offsetXInput = document.querySelector("#offsetXInput");
const offsetYInput = document.querySelector("#offsetYInput");
const activeImageInput = document.querySelector("#activeImageInput");
const blendLocationInput = document.querySelector("#blendLocationInput");
const blendStrengthInput = document.querySelector("#blendStrengthInput");
const monoInput = document.querySelector("#monoInput");
const markdownInput = document.querySelector("#markdownInput");
const manualLinesInput = document.querySelector("#manualLinesInput");
const dualPhotoInput = document.querySelector("#dualPhotoInput");
const downloadButton = document.querySelector("#downloadButton");
const shareButton = document.querySelector("#shareButton");
const resetButton = document.querySelector("#resetButton");

const state = {
  image: null,
  image2: null,
  caption: captionInput.value,
  textSize: Number(textSizeInput.value),
  textOffsetY: Number(textOffsetYInput.value),
  lineHeight: Number(lineHeightInput.value),
  zoom: Number(zoomInput.value),
  zoom2: Number(zoomInput.value),
  offsetX: Number(offsetXInput.value),
  offsetY: Number(offsetYInput.value),
  offsetX2: 0,
  offsetY2: 0,
  blendLocation: Number(blendLocationInput.value),
  blendStrength: Number(blendStrengthInput.value),
  mono: monoInput.checked,
  markdown: markdownInput.checked,
  manualLines: manualLinesInput.checked,
  dualPhoto: dualPhotoInput.checked,
  activeImage: activeImageInput.value,
  textSizeRanges: [],
  lineHeightRanges: [],
  selectedTextRange: null,
  dragging: false,
  lastPoint: null,
};

const W = canvas.width;
const H = canvas.height;
const photoArea = { x: 0, y: 0, w: W, h: 930 };
const captionArea = { x: 70, y: 1200, w: 940, h: 80 };
const captionFont = '"Barlow Condensed", Arial, Helvetica, sans-serif';
const captionWhite = "#ffffff";
const logoGreen = "#f5d548";
const captionHighlight = "#ffd101";
const backgroundImage = new Image();
backgroundImage.onload = () => draw();
backgroundImage.src = "assets/postareSAN.png";

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (backgroundImage.complete && backgroundImage.naturalWidth) {
    ctx.drawImage(backgroundImage, 0, 0, W, H);
  } else {
    drawSanMarcoFooter();
  }
  drawPhotoLayer();
  drawCaption();
}

function drawPhotoLayer() {
  if (!state.image) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
  ctx.clip();

  const img = state.image;
  const cover = coverRect(img.width, img.height, photoArea.w, photoArea.h);
  const drawW = cover.w * state.zoom;
  const drawH = cover.h * state.zoom;
  const drawX = photoArea.x + (photoArea.w - drawW) / 2 + state.offsetX;
  const drawY = photoArea.y + (photoArea.h - drawH) / 2 + state.offsetY;

  if (state.mono) ctx.filter = "grayscale(1) contrast(1.08)";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  if (state.dualPhoto && state.image2) {
    const img2 = state.image2;
    const cover2 = coverRect(img2.width, img2.height, photoArea.w, photoArea.h);
    const drawW2 = cover2.w * state.zoom2;
    const drawH2 = cover2.h * state.zoom2;
    const drawX2 = photoArea.x + (photoArea.w - drawW2) / 2 + state.offsetX2;
    const drawY2 = photoArea.y + (photoArea.h - drawH2) / 2 + state.offsetY2;

    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = W;
    overlayCanvas.height = H;
    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.drawImage(img2, drawX2, drawY2, drawW2, drawH2);

    const blendCenter = photoArea.x + photoArea.w * (state.blendLocation / 100);
    const tightBlendWidth = photoArea.w * 0.08;
    const blendStart = blendCenter - tightBlendWidth / 2;
    const blendEnd = blendCenter + tightBlendWidth / 2;
    const overlayMask = overlayCtx.createLinearGradient(blendStart, 0, blendEnd, 0);
    overlayMask.addColorStop(0, "rgba(0, 0, 0, 0)");
    overlayMask.addColorStop(1, "rgba(0, 0, 0, 1)");
    overlayCtx.globalCompositeOperation = "destination-in";
    overlayCtx.fillStyle = overlayMask;
    overlayCtx.fillRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);

    ctx.globalAlpha = state.blendStrength / 100;
    ctx.drawImage(overlayCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }

  ctx.filter = "none";
  const fade = ctx.createLinearGradient(0, photoArea.h * 0.72, 0, photoArea.h);
  fade.addColorStop(0, "rgba(0, 0, 0, 0)");
  fade.addColorStop(1, "rgba(0, 0, 0, 1)");
  ctx.fillStyle = fade;
  ctx.fillRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
  ctx.restore();
}

function drawCaption() {
  const text = state.caption;
  if (!text.trim()) return;

  const fontSize = state.textSize;
  const lines = wrapRichText(text, captionArea.w, fontSize);
  const lineMetrics = captionLineMetrics(lines);
  const totalHeight = lineMetrics.totalHeight;
  const firstY = captionArea.y + (captionArea.h - totalHeight) / 2 + lineMetrics.firstLineSize * 0.82 + state.textOffsetY;

  ctx.save();
  setCaptionFont(fontSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let y = firstY;
  lines.forEach((line, index) => {
    drawRichLine(line, captionArea.x + captionArea.w / 2, y);
    y += lineMetrics.advances[index] || 0;
  });
  ctx.restore();
}

function drawSanMarcoFooter() {
  const centerY = 1304;
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7f7f7";
  ctx.font = '700 23px Arial, Helvetica, sans-serif';
  ctx.textAlign = "right";
  ctx.fillText("Follow", 432, centerY);

  ctx.strokeStyle = logoGreen;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(462, centerY, 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = logoGreen;
  ctx.font = '700 8px Arial, Helvetica, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("SAN MARCO", 462, centerY);

  ctx.fillStyle = "#f7f7f7";
  ctx.font = '700 23px Arial, Helvetica, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("@sanmarco.pizzeria", 496, centerY);

  [510, 525, 540, 555, 570].forEach((x, index) => {
    ctx.beginPath();
    ctx.fillStyle = index === 0 ? "#f7f7f7" : "#737373";
    ctx.arc(x, 1328, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}


function coverRect(srcW, srcH, destW, destH) {
  const scale = Math.max(destW / srcW, destH / srcH);
  return { w: srcW * scale, h: srcH * scale };
}

function wrapRichText(text, maxWidth, fontSize) {
  setCaptionFont(fontSize);
  if (!state.manualLines) return wrapParagraph(normalizeCaptionText(text), maxWidth);

  const forcedLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines = [];
  let sourceStart = 0;

  for (const forcedLine of forcedLines) {
    const lineText = forcedLine.replace(/[^\S\n]+/g, " ").trim();
    const trimOffset = forcedLine.search(/\S/);
    if (!lineText) {
      lines.push([]);
      sourceStart += forcedLine.length + 1;
      continue;
    }
    lines.push(...wrapParagraph({ text: lineText, sourceStart: sourceStart + Math.max(trimOffset, 0) }, maxWidth));
    sourceStart += forcedLine.length + 1;
  }

  return lines.length ? lines : [[makeToken("Your caption", false, 0, 0)]];
}

function normalizeCaptionText(text) {
  const match = text.match(/\S(?:[\s\S]*\S)?/);
  if (!match) return { text: "", sourceStart: 0 };
  return { text: match[0].replace(/\s+/g, " "), sourceStart: match.index };
}

function wrapParagraph(paragraph, maxWidth) {
  const tokens = tokenizeSegments(parseMarkdownSegments(paragraph.text, paragraph.sourceStart));
  const lines = [];
  let line = [];
  let width = 0;
  let needsSpace = false;

  for (const token of tokens) {
    if (token.text === " ") {
      needsSpace = line.length > 0;
      continue;
    }

    const pieces = splitLongToken(token, maxWidth);
    for (const piece of pieces) {
      const spaceToken = makeToken(" ", false, piece.sourceStart, piece.sourceEnd);
      const spaceWidth = needsSpace && line.length ? measureToken(spaceToken) : 0;
      const pieceWidth = measureToken(piece);

      if (line.length && width + spaceWidth + pieceWidth > maxWidth) {
        lines.push(line);
        line = [];
        width = 0;
        needsSpace = false;
      }

      if (needsSpace && line.length) {
        line.push(spaceToken);
        width += spaceWidth;
      }

      line.push(piece);
      width += pieceWidth;
      needsSpace = false;
    }
  }

  if (line.length) lines.push(line);
  return lines;
}

function parseMarkdownSegments(text, sourceStart = 0) {
  if (!state.markdown) return [{ text, highlight: false, sourceStart, sourceEnd: sourceStart + text.length }];

  const segments = [];
  const emphasisPattern = /(\*\*|__|\*|_)([^*_]+?)\1/g;
  let cursor = 0;
  let match;

  while ((match = emphasisPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), highlight: false, sourceStart: sourceStart + cursor, sourceEnd: sourceStart + match.index });
    }
    segments.push({
      text: match[2],
      highlight: true,
      sourceStart: sourceStart + match.index + match[1].length,
      sourceEnd: sourceStart + match.index + match[1].length + match[2].length,
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlight: false, sourceStart: sourceStart + cursor, sourceEnd: sourceStart + text.length });
  return segments.filter((segment) => segment.text.length);
}

function findNextEmphasisMarker(text, cursor) {
  const star = text.indexOf("*", cursor);
  const underscore = text.indexOf("_", cursor);
  if (star === -1) return underscore;
  if (underscore === -1) return star;
  return Math.min(star, underscore);
}

function emphasisMarkerAt(text, index) {
  const char = text[index];
  return text[index + 1] === char ? char + char : char;
}

function tokenizeSegments(segments) {
  return segments.flatMap((segment) => {
    let cursor = 0;
    return segment.text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((part) => {
        const sourceStart = segment.sourceStart + cursor;
        cursor += part.length;
        const isSpace = /\s+/.test(part);
        return makeToken(isSpace ? " " : part, segment.highlight && !isSpace, sourceStart, sourceStart + part.length);
      });
  });
}

function makeToken(text, highlight, sourceStart, sourceEnd) {
  const lineHeightRange = latestRangeForPosition(state.lineHeightRanges, sourceStart, sourceEnd);
  return {
    text: text.toUpperCase(),
    highlight,
    sourceStart,
    sourceEnd,
    fontSize: textSizeForRange(sourceStart, sourceEnd),
    lineHeight: lineHeightRange?.lineHeight || state.lineHeight,
    hasLineHeightOverride: Boolean(lineHeightRange),
  };
}

function textSizeForRange(sourceStart, sourceEnd) {
  const range = latestRangeForPosition(state.textSizeRanges, sourceStart, sourceEnd);
  return range?.size || state.textSize;
}

function latestRangeForPosition(ranges, sourceStart, sourceEnd) {
  const midpoint = sourceStart + Math.max(0, sourceEnd - sourceStart) / 2;
  return [...ranges].reverse().find((item) => midpoint >= item.start && midpoint < item.end);
}

function splitLongToken(token, maxWidth) {
  if (measureToken(token) <= maxWidth) return [token];

  const pieces = [];
  let piece = "";
  for (const char of token.text) {
    if (measureText(piece + char, token.fontSize) <= maxWidth) {
      piece += char;
    } else {
      if (piece) pieces.push({ ...token, text: piece });
      piece = char;
    }
  }

  if (piece) pieces.push({ ...token, text: piece });
  return pieces;
}

function drawRichLine(line, centerX, y) {
  const totalWidth = lineWidth(line);
  const lineFontSize = lineMaxFontSize(line);
  let x = centerX - totalWidth / 2;

  for (const token of line) {
    const tokenY = y + tokenTopAlignmentOffset(token, lineFontSize) + tokenBaselineOffset(token);
    if (token.highlight) {
      drawGreenText(token, x, tokenY);
    } else {
      setCaptionFont(token.fontSize);
      ctx.fillStyle = captionWhite;
      ctx.fillText(token.text, x, tokenY);
    }
    x += measureToken(token);
  }
}

function lineMaxFontSize(line) {
  return line.length ? Math.max(...line.map((token) => token.fontSize || state.textSize)) : state.textSize;
}

function tokenTopAlignmentOffset(token, lineFontSize) {
  const fontSize = token.fontSize || state.textSize;
  return Math.round((fontSize - lineFontSize) * 0.82);
}

function tokenBaselineOffset(token) {
  if (!token.hasLineHeightOverride) return 0;
  const fontSize = token.fontSize || state.textSize;
  return Math.round((token.lineHeight - state.lineHeight) * fontSize);
}

function drawGreenText(token, x, y) {
  const text = token.text;
  const fontSize = token.fontSize || state.textSize;

  ctx.save();
  setCaptionFont(fontSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  ctx.fillStyle = captionHighlight;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function setCaptionFont(fontSize, italic = false) {
  ctx.font = `${italic ? "italic " : ""}600 ${fontSize}px ${captionFont}`;
}

function lineWidth(line) {
  return line.reduce((sum, token) => sum + measureToken(token), 0);
}

function captionLineMetrics(lines) {
  const lineSizes = lines.map((line) => (line.length ? Math.max(...line.map((token) => token.fontSize || state.textSize)) : state.textSize));
  const lineHeights = lines.map((line) => (line.length ? Math.min(...line.map((token) => (token.hasLineHeightOverride ? state.lineHeight : token.lineHeight || state.lineHeight))) : state.lineHeight));
  const advances = lines.map((_, index) => {
    if (index === lines.length - 1) return 0;
    const nextSize = Math.max(lineSizes[index], lineSizes[index + 1]);
    const nextHeight = Math.min(lineHeights[index], lineHeights[index + 1]);
    return Math.round(nextSize * nextHeight);
  });
  return {
    firstLineSize: lineSizes[0] || state.textSize,
    advances,
    totalHeight: advances.reduce((sum, advance) => sum + advance, lineSizes.at(-1) || state.textSize),
  };
}

function measureToken(token) {
  return measureText(token.text, token.fontSize || state.textSize);
}

function measureText(text, fontSize = state.textSize, italic = false) {
  ctx.save();
  setCaptionFont(fontSize, italic);
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

function syncPositionControls() {
  const isSecond = state.dualPhoto && state.activeImage === "image2";
  zoomInput.value = String(isSecond ? state.zoom2 : state.zoom);
  offsetXInput.value = String(Math.round(isSecond ? state.offsetX2 : state.offsetX));
  offsetYInput.value = String(Math.round(isSecond ? state.offsetY2 : state.offsetY));
}

function handleActiveImageChange() {
  state.activeImage = activeImageInput.value;
  syncPositionControls();
  draw();
}

function currentTextSelection() {
  const start = captionInput.selectionStart;
  const end = captionInput.selectionEnd;
  if (start === end) return null;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function rememberTextSelection() {
  state.selectedTextRange = currentTextSelection();
}

function handleTextSizeInput() {
  applySelectedRangeControl({
    input: textSizeInput,
    rangesKey: "textSizeRanges",
    stateKey: "textSize",
    valueKey: "size",
  });
}

function handleLineHeightInput() {
  applySelectedRangeControl({
    input: lineHeightInput,
    rangesKey: "lineHeightRanges",
    stateKey: "lineHeight",
    valueKey: "lineHeight",
  });
}

function applySelectedRangeControl({ input, rangesKey, stateKey, valueKey }) {
  state.caption = captionInput.value;
  const selectedRange = currentTextSelection() || state.selectedTextRange;

  if (!selectedRange) {
    state[stateKey] = Number(input.value);
    state[rangesKey] = [];
    updateFromControls();
    return;
  }

  const { start, end } = selectedRange;
  state.selectedTextRange = selectedRange;
  state[rangesKey] = [
    ...state[rangesKey].filter((range) => range.end <= start || range.start >= end),
    { start, end, [valueKey]: Number(input.value) },
  ];
  draw();
}

function updateFromControls() {
  state.caption = captionInput.value;
  if (!state.selectedTextRange) {
    state.textSize = Number(textSizeInput.value);
    state.lineHeight = Number(lineHeightInput.value);
  }
  state.textOffsetY = Number(textOffsetYInput.value);
  const useSecond = state.dualPhoto && state.activeImage === "image2";
  if (useSecond) state.zoom2 = Number(zoomInput.value);
  else state.zoom = Number(zoomInput.value);
  if (useSecond) {
    state.offsetX2 = Number(offsetXInput.value);
    state.offsetY2 = Number(offsetYInput.value);
  } else {
    state.offsetX = Number(offsetXInput.value);
    state.offsetY = Number(offsetYInput.value);
  }
  state.blendLocation = Number(blendLocationInput.value);
  state.blendStrength = Number(blendStrengthInput.value);
  state.mono = monoInput.checked;
  state.markdown = markdownInput.checked;
  state.manualLines = manualLinesInput.checked;
  state.dualPhoto = dualPhotoInput.checked;
  if (!state.dualPhoto && state.activeImage === "image2") {
    state.activeImage = "image";
    activeImageInput.value = "image";
  }
  draw();
}

function resetAdjustments() {
  textOffsetYInput.value = "0";
  lineHeightInput.value = "1.22";
  state.selectedTextRange = null;
  state.textSizeRanges = [];
  state.lineHeightRanges = [];
  zoomInput.value = "1";
  offsetXInput.value = "0";
  offsetYInput.value = "0";
  state.zoom = 1;
  state.zoom2 = 1;
  state.offsetX2 = 0;
  state.offsetY2 = 0;
  blendLocationInput.value = "50";
  blendStrengthInput.value = "100";
  updateFromControls();
}

function resetSingleControl(controlId) {
  const control = document.querySelector(`#${controlId}`);
  if (!control) return;
  const defaults = {
    textSizeInput: "56",
    textOffsetYInput: "0",
    lineHeightInput: "1.22",
    zoomInput: "1",
    offsetXInput: "0",
    offsetYInput: "0",
    blendLocationInput: "50",
    blendStrengthInput: "100",
  };
  if (controlId === "offsetXInput") {
    if (state.dualPhoto && state.activeImage === "image2") state.offsetX2 = 0;
    else state.offsetX = 0;
    syncPositionControls();
    draw();
    return;
  }

  if (controlId === "offsetYInput") {
    if (state.dualPhoto && state.activeImage === "image2") state.offsetY2 = 0;
    else state.offsetY = 0;
    syncPositionControls();
    draw();
    return;
  }
  if (controlId === "zoomInput") {
    if (state.dualPhoto && state.activeImage === "image2") state.zoom2 = 1;
    else state.zoom = 1;
    syncPositionControls();
    draw();
    return;
  }

  control.value = defaults[controlId] || "0";
  if (controlId === "textSizeInput" || controlId === "lineHeightInput") {
    state.selectedTextRange = null;
    if (controlId === "textSizeInput") {
      state.textSizeRanges = [];
      state.textSize = Number(control.value);
    } else {
      state.lineHeightRanges = [];
      state.lineHeight = Number(control.value);
    }
  }
  updateFromControls();
}

async function loadImage(file, target = "image") {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    state[target] = image;
    shareButton.disabled = !navigator.canShare;
    draw();
  };
  image.src = url;
}

function exportBlob() {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.98);
  });
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function saveImage() {
  const blob = await exportBlob();
  if (!blob) return;

  const objectUrl = URL.createObjectURL(blob);
  triggerDownload(objectUrl, `san-marco-${Date.now()}.png`);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

async function shareImage() {
  const blob = await exportBlob();
  const file = new File([blob], "san-marco.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "San Marco Generator" });
    return;
  }

  await saveImage();
}

function pointFromEvent(event) {
  const touch = event.touches?.[0];
  const point = touch || event;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((point.clientX - rect.left) / rect.width) * W,
    y: ((point.clientY - rect.top) / rect.height) * H,
  };
}

function startDrag(event) {
  if (!state.image) return;
  if (event.pointerType === "touch") return;
  state.dragging = true;
  state.lastPoint = pointFromEvent(event);
}

function moveDrag(event) {
  if (event.pointerType === "touch") return;
  if (!state.dragging || !state.lastPoint) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  const dx = point.x - state.lastPoint.x;
  const dy = point.y - state.lastPoint.y;
  const useSecond = state.dualPhoto && state.activeImage === "image2";
  if (useSecond) {
    state.offsetX2 = clamp(state.offsetX2 + dx, Number(offsetXInput.min), Number(offsetXInput.max));
    state.offsetY2 = clamp(state.offsetY2 + dy, Number(offsetYInput.min), Number(offsetYInput.max));
  } else {
    state.offsetX = clamp(state.offsetX + dx, Number(offsetXInput.min), Number(offsetXInput.max));
    state.offsetY = clamp(state.offsetY + dy, Number(offsetYInput.min), Number(offsetYInput.max));
  }
  syncPositionControls();
  state.lastPoint = point;
  draw();
}

function endDrag() {
  state.dragging = false;
  state.lastPoint = null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

imageInput.addEventListener("change", (event) => loadImage(event.target.files?.[0], "image"));
imageInput2.addEventListener("change", (event) => loadImage(event.target.files?.[0], "image2"));
captionInput.addEventListener("input", () => {
  state.selectedTextRange = currentTextSelection();
  state.textSizeRanges = state.textSizeRanges.filter((range) => range.start < captionInput.value.length);
  state.lineHeightRanges = state.lineHeightRanges.filter((range) => range.start < captionInput.value.length);
  updateFromControls();
});
captionInput.addEventListener("select", rememberTextSelection);
captionInput.addEventListener("keyup", rememberTextSelection);
captionInput.addEventListener("mouseup", rememberTextSelection);
textSizeInput.addEventListener("input", handleTextSizeInput);
textOffsetYInput.addEventListener("input", updateFromControls);
lineHeightInput.addEventListener("input", handleLineHeightInput);
zoomInput.addEventListener("input", updateFromControls);
offsetXInput.addEventListener("input", updateFromControls);
offsetYInput.addEventListener("input", updateFromControls);
blendLocationInput.addEventListener("input", updateFromControls);
blendStrengthInput.addEventListener("input", updateFromControls);
monoInput.addEventListener("change", updateFromControls);
markdownInput.addEventListener("change", updateFromControls);
manualLinesInput.addEventListener("change", updateFromControls);
dualPhotoInput.addEventListener("change", updateFromControls);
activeImageInput.addEventListener("change", handleActiveImageChange);
downloadButton.addEventListener("click", saveImage);
shareButton.addEventListener("click", shareImage);
resetButton.addEventListener("click", resetAdjustments);
document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => resetSingleControl(button.dataset.reset));
});

if (document.fonts) {
  document.fonts.ready.then(draw);
  document.fonts.load(`700 48px ${captionFont}`).then(draw);
}

if (navigator.canShare) shareButton.disabled = false;

syncPositionControls();

if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", startDrag);
  canvas.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

draw();
