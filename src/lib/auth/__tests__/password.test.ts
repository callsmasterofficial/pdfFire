import { describe, it, expect } from "vitest";
import {
  CLIENT_ITERATIONS,
  SERVER_ITERATIONS,
  deriveAuthKey,
  emailKey,
  fromHex,
  hashAuthKey,
  hashSessionToken,
  randomHex,
  timingSafeEqual,
  toHex,
} from "../password";

describe("the client-side derivation", () => {
  it("is deterministic, so signing in needs no stored salt", async () => {
    const a = await deriveAuthKey("correct horse", "Person@Example.com", 1_000);
    const b = await deriveAuthKey("correct horse", "person@example.com", 1_000);
    expect(a).toBe(b);
  });

  it("binds the key to the address, so one password gives different keys", async () => {
    const a = await deriveAuthKey("same password", "a@example.com", 1_000);
    const b = await deriveAuthKey("same password", "b@example.com", 1_000);
    expect(a).not.toBe(b);
  });

  it("produces 256 bits", async () => {
    const key = await deriveAuthKey("pw", "a@example.com", 1_000);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("costs more as iterations rise, which is the point", () => {
    expect(CLIENT_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    // The server's share has to fit inside a 10 ms request budget; 10,000
    // measured at 1 ms in workerd.
    expect(SERVER_ITERATIONS).toBeLessThanOrEqual(20_000);
  });
});

describe("the server-side hash", () => {
  it("never stores the auth key it was given", async () => {
    const authKey = await deriveAuthKey("pw", "a@example.com", 1_000);
    const salt = randomHex(16);
    const stored = await hashAuthKey(authKey, salt, SERVER_ITERATIONS);
    expect(stored).not.toBe(authKey);
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives different rows for the same key under different salts", async () => {
    const authKey = await deriveAuthKey("pw", "a@example.com", 1_000);
    const one = await hashAuthKey(authKey, randomHex(16), SERVER_ITERATIONS);
    const two = await hashAuthKey(authKey, randomHex(16), SERVER_ITERATIONS);
    expect(one).not.toBe(two);
  });

  it("recomputes to the same value, which is what a login checks", async () => {
    const authKey = await deriveAuthKey("pw", "a@example.com", 1_000);
    const salt = randomHex(16);
    expect(await hashAuthKey(authKey, salt, SERVER_ITERATIONS)).toBe(
      await hashAuthKey(authKey, salt, SERVER_ITERATIONS)
    );
  });

  it("rejects a wrong password end to end", async () => {
    const salt = randomHex(16);
    const right = await hashAuthKey(
      await deriveAuthKey("correct horse", "a@example.com", 1_000),
      salt
    );
    const wrong = await hashAuthKey(
      await deriveAuthKey("wrong horse", "a@example.com", 1_000),
      salt
    );
    expect(timingSafeEqual(right, wrong)).toBe(false);
  });
});

describe("supporting pieces", () => {
  it("normalises an address the way the unique index does", () => {
    expect(emailKey("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("round-trips hex", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    expect(fromHex(toHex(bytes))).toEqual(bytes);
  });

  it("compares equal strings as equal and differing ones as not", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });

  it("hashes a session token rather than storing it", async () => {
    const token = randomHex(32);
    const hash = await hashSessionToken(token);
    expect(hash).not.toBe(token);
    expect(hash).toBe(await hashSessionToken(token));
  });

  it("does not repeat a random token", () => {
    const seen = new Set(Array.from({ length: 200 }, () => randomHex(32)));
    expect(seen.size).toBe(200);
  });
});
