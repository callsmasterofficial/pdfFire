export interface VisualDiffResult {
  diffCanvas: HTMLCanvasElement;
  diffPercent: number;
  differentPixels: number;
  totalPixels: number;
}

export function computeVisualDiff(
  canvasA: HTMLCanvasElement,
  canvasB: HTMLCanvasElement
): VisualDiffResult {
  const width = Math.max(canvasA.width, canvasB.width);
  const height = Math.max(canvasA.height, canvasB.height);

  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const ctxDiff = diffCanvas.getContext("2d");

  if (!ctxDiff) {
    throw new Error("Unable to create canvas context for visual diff");
  }

  const ctxA = canvasA.getContext("2d");
  const ctxB = canvasB.getContext("2d");

  if (!ctxA || !ctxB) {
    throw new Error("Invalid source canvases for visual diff");
  }

  const imgDataA = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
  const imgDataB = ctxB.getImageData(0, 0, canvasB.width, canvasB.height);
  const outputImgData = ctxDiff.createImageData(width, height);

  const dataA = imgDataA.data;
  const dataB = imgDataB.data;
  const out = outputImgData.data;

  let differentPixels = 0;
  const totalPixels = width * height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const inA = x < canvasA.width && y < canvasA.height;
      const inB = x < canvasB.width && y < canvasB.height;

      const idxA = inA ? (y * canvasA.width + x) * 4 : -1;
      const idxB = inB ? (y * canvasB.width + x) * 4 : -1;

      const rA = idxA >= 0 ? dataA[idxA] : 255;
      const gA = idxA >= 0 ? dataA[idxA + 1] : 255;
      const bA = idxA >= 0 ? dataA[idxA + 2] : 255;

      const rB = idxB >= 0 ? dataB[idxB] : 255;
      const gB = idxB >= 0 ? dataB[idxB + 1] : 255;
      const bB = idxB >= 0 ? dataB[idxB + 2] : 255;

      const delta = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB);

      if (delta > 35) {
        differentPixels++;
        out[idx] = 239;     // Red
        out[idx + 1] = 68;  // Green
        out[idx + 2] = 68;  // Blue
        out[idx + 3] = 220; // Alpha
      } else {
        const gray = Math.round(0.299 * rA + 0.587 * gA + 0.114 * bA);
        out[idx] = gray;
        out[idx + 1] = gray;
        out[idx + 2] = gray;
        out[idx + 3] = 45;
      }
    }
  }

  ctxDiff.putImageData(outputImgData, 0, 0);
  const diffPercent = totalPixels > 0 ? Number(((differentPixels / totalPixels) * 100).toFixed(2)) : 0;

  return { diffCanvas, diffPercent, differentPixels, totalPixels };
}
