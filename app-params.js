// src/lib/app-params.js

const isNode = typeof window === "undefined";

const DEFAULT_SERVER_URL = "https://app.base44.com";
const DEFAULT_APP_ID = "691eb67221759ebcd9ac9b90";

const toSnakeCase = (str) => str.replace(/([A-Z])/g, "_$1").toLowerCase();

const getStorage = () => {
  if (isNode) return null;
  return window.localStorage;
};

const getAllUrlParams = () => {
  if (isNode) return new URLSearchParams();

  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash || "";
  const hashWithoutHash = hash.startsWith("#") ? hash.slice(1) : hash;

  const hashQueryIndex = hashWithoutHash.indexOf("?");
  if (hashQueryIndex >= 0) {
    const hashQuery = hashWithoutHash.slice(hashQueryIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    for (const [k, v] of hashParams.entries()) {
      params.set(k, v);
    }
    return params;
  }

  // Only treat hash as auth/query params when it is NOT a normal route like #/Transactions
  if (!hashWithoutHash.includes("/") && hashWithoutHash.includes("=")) {
    const hashParams = new URLSearchParams(hashWithoutHash);
    for (const [k, v] of hashParams.entries()) {
      params.set(k, v);
    }
  }

  return params;
};

const cleanUrl = (keysToRemove = []) => {
  if (isNode) return;

  const urlParams = new URLSearchParams(window.location.search);
  let queryChanged = false;

  keysToRemove.forEach((k) => {
    if (urlParams.has(k)) {
      urlParams.delete(k);
      queryChanged = true;
    }
  });

  const hash = window.location.hash || "";
  let newHash = hash;

  if (hash.includes("?")) {
    const [routePart, queryPart] = hash.split("?");
    const hashParams = new URLSearchParams(queryPart);
    let hashChanged = false;

    keysToRemove.forEach((k) => {
      if (hashParams.has(k)) {
        hashParams.delete(k);
        hashChanged = true;
      }
    });

    if (hashChanged) {
      const rebuilt = hashParams.toString();
      newHash = rebuilt ? `${routePart}?${rebuilt}` : routePart;
    }
  } else if (hash.startsWith("#") && !hash.includes("/") && hash.includes("=")) {
    const hashParams = new URLSearchParams(hash.slice(1));
    let hashChanged = false;

    keysToRemove.forEach((k) => {
      if (hashParams.has(k)) {
        hashParams.delete(k);
        hashChanged = true;
      }
    });

    if (hashChanged) {
      const rebuilt = hashParams.toString();
      newHash = rebuilt ? `#${rebuilt}` : "";
    }
  }

  if (queryChanged || newHash !== hash) {
    const newQuery = urlParams.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}${newHash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
};

const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {}
) => {
  if (isNode) return defaultValue ?? null;

  const storage = getStorage();
  const storageKey = `base44_${toSnakeCase(paramName)}`;

  const allParams = getAllUrlParams();
  const value = allParams.get(paramName);

  if (removeFromUrl && value) {
    cleanUrl([paramName]);
  }

  if (value) {
    storage?.setItem(storageKey, value);
    return value;
  }

  const storedValue = storage?.getItem(storageKey);
  if (storedValue) return storedValue;

  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
    storage?.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  return null;
};

const getAppParams = () => {
  const envAppId = import.meta.env.VITE_BASE44_APP_ID;
  const envServerUrl = import.meta.env.VITE_BASE44_BACKEND_URL;

  const appId =
    getAppParamValue("app_id", { defaultValue: envAppId || DEFAULT_APP_ID }) ||
    DEFAULT_APP_ID;

  const serverUrl =
    getAppParamValue("server_url", { defaultValue: envServerUrl || DEFAULT_SERVER_URL }) ||
    DEFAULT_SERVER_URL;

  const token =
    getAppParamValue("access_token", { removeFromUrl: true }) ||
    getAppParamValue("token", { removeFromUrl: true }) ||
    null;

  const functionsVersion = getAppParamValue("functions_version") || "v1";

  return {
    appId,
    serverUrl,
    token,
    fromUrl:
      getAppParamValue("from_url", { defaultValue: window.location.href }) ||
      window.location.href,
    functionsVersion,
  };
};

export const appParams = {
  ...getAppParams(),
};