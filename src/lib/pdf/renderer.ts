import type { PDFPageProxy, RenderTask } from "pdfjs-dist";

export interface RenderPageOptions {
  scale?: number;
  rotation?: number;
}

export interface ActiveRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

export function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  options: RenderPageOptions = {}
): ActiveRenderTask {
  const { scale = 1.0, rotation = 0 } = options;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Viewport at target scale, accounting for rotation
  const totalRotation = (page.rotate + rotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  // High-DPI canvas dimensions
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    return {
      promise: Promise.reject(new Error("Unable to obtain 2D canvas context")),
      cancel: () => {},
    };
  }

  // White background by default for transparent PDFs
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let renderTask: RenderTask | null = null;
  let isCancelled = false;

  const promise = (async () => {
    // Transform matrix for HiDPI
    const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

    renderTask = page.render({
      canvasContext: ctx,
      canvas,
      viewport,
      transform,
    });

    try {
      await renderTask.promise;
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === "RenderingCancelledException" || isCancelled) {
        // Expected cancellation when user quickly scrolls or resizes
        return;
      }
      throw err;
    }
  })();

  return {
    promise,
    cancel: () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    },
  };
}

export async function generateThumbnail(
  page: PDFPageProxy,
  targetWidth = 140
): Promise<string> {
  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Unable to create offscreen canvas context for thumbnail");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    canvas,
    viewport,
  });

  await renderTask.promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

  // Clear canvas reference to facilitate GC
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

export const renderPdfPageToCanvas = renderPageToCanvas;
