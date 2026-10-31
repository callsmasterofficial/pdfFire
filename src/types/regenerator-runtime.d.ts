/**
 * `regenerator-runtime/runtime.js` ships no types. It is imported purely for
 * its side effect: fontkit's Indic and Universal shapers are transpiled with
 * generators and expect a regenerator runtime on the global object, without
 * which Devanagari and Thai throw instead of shaping.
 */
declare module "regenerator-runtime/runtime.js";
