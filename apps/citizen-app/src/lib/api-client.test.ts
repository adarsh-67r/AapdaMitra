/**
 * The one thing that must never silently degrade: how a misconfigured build
 * reports itself.
 */
const REAL_URL = process.env.EXPO_PUBLIC_API_URL;

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

/**
 * The base URL is read once at module scope, the way Expo inlines
 * EXPO_PUBLIC_* at bundle time, so each case needs a fresh module registry.
 */
function loadClient(apiUrl: string | undefined) {
  if (apiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = apiUrl;
  let mod!: typeof import("@/lib/api-client");
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules is synchronous, so a dynamic import() cannot be used here.
    mod = require("@/lib/api-client");
  });
  return mod;
}

beforeEach(() => {
  jest.resetAllMocks();
  globalThis.fetch = jest.fn();
});

afterAll(() => {
  process.env.EXPO_PUBLIC_API_URL = REAL_URL;
});

test("a build with no server address says so, instead of looking offline", async () => {
  const { apiFetch } = loadClient(undefined);

  // The EAS build shipped without EXPO_PUBLIC_API_URL, so every request went to
  // the literal string "undefined" and failed at DNS. The citizen was told
  // there was no connection while holding a phone with four bars.
  await expect(apiFetch("/reports")).rejects.toThrow(/EXPO_PUBLIC_API_URL/);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

test("a trailing slash on the base does not become a double slash", async () => {
  const { apiFetch } = loadClient("https://example.test/");
  (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true });

  await apiFetch("/reports");

  expect(globalThis.fetch).toHaveBeenCalledWith("https://example.test/reports", expect.anything());
});

test("a read retries a dropped connection before giving up", async () => {
  const { apiFetch } = loadClient("https://example.test");
  (globalThis.fetch as jest.Mock)
    .mockRejectedValueOnce(new Error("Network request failed"))
    .mockResolvedValueOnce({ ok: true, status: 200 });

  const res = await apiFetch("/alerts");

  expect(res.status).toBe(200);
  expect(globalThis.fetch).toHaveBeenCalledTimes(2);
});

test("a write is never retried, so one report cannot become two", async () => {
  const { apiFetch } = loadClient("https://example.test");
  (globalThis.fetch as jest.Mock).mockRejectedValue(new Error("Network request failed"));

  await expect(apiFetch("/reports", { method: "POST" })).rejects.toThrow(
    "Network request failed"
  );
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
});
