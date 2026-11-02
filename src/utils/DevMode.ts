export class DevMode {
  private static readonly storageKey = "hot-potato-pete-dev";

  public static isEnabled(): boolean {
    if (typeof DEV_TOOLS === "undefined" || !DEV_TOOLS) return false;
    if (typeof window === "undefined") return false;

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dev") === "1" || params.get("dev") === "true") return true;
    } catch {
      // Fall through to the localStorage fallback.
    }

    try {
      return window.localStorage.getItem(DevMode.storageKey) === "1";
    } catch {
      return false;
    }
  }
}
