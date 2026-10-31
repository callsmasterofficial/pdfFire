/**
 * Test-runner shims.
 *
 * pdfjs-dist@6 uses `Promise.try` and `Uint8Array.prototype.toHex`, which this
 * project's Node baseline (22.x) does not provide. Browsers that ship PDF.js 6
 * have both, so these exist only so the test runner can parse PDFs with a real
 * engine. Nothing here reaches the application bundle.
 */
const PromiseCtor = Promise as unknown as {
  try?: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown>;
};
if (typeof PromiseCtor.try !== "function") {
  PromiseCtor.try = (fn, ...args) =>
    new Promise((resolve, reject) => {
      try {
        resolve(fn(...args));
      } catch (error) {
        reject(error);
      }
    });
}

const Uint8ArrayProto = Uint8Array.prototype as unknown as { toHex?: () => string };
if (typeof Uint8ArrayProto.toHex !== "function") {
  Uint8ArrayProto.toHex = function toHex(this: Uint8Array) {
    return Array.from(this, (byte) => byte.toString(16).padStart(2, "0")).join("");
  };
}
