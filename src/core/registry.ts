import { createApiRegistry } from "./api-registry";
import type { XtensionAPIShape, PluginConfig, PluginConfigMap, PluginContext, PluginDefinition, PluginEntry } from "./types";

const _store: Record<string, PluginEntry> = {};
let _cfgStore: PluginConfigMap = {};
const _api = createApiRegistry();

function register(plugin: PluginDefinition): void {
  if (!plugin.id || !plugin.name) {
    console.warn("[XtensionAPI | Plugin Registrar] Skipping plugin with missing id/name:", plugin);
    return;
  }
  _store[plugin.id] = {...plugin, _active: false, _cleanupFns: []};
}

const getAll = (): PluginEntry[] => Object.values(_store);

function activate(id: string): void {
  const p = _store[id];
  if (!p) return;

  p._cleanupFns = [];
  const ctx: PluginContext = {
    id: p.id,
    config: getConfig(id),
    api: _api,
    onCleanup(fn) {
      p._cleanupFns.push(fn);
    },
  };

  try {
    p.start?.(ctx);
    p._active = true;
  } catch (err) {
    console.warn(`[XtensionAPI | Plugin Registrar] Plugin "${id}" threw during start:`, err);
    runCleanup(p);
  }
}

function runCleanup(p: PluginEntry): void {
  for (const fn of p._cleanupFns) {
    try {
      fn();
    } catch (err) {
      console.warn(`[XtensionAPI | Plugin Registrar] Plugin "${p.id}" cleanup fn threw:`, err);
    }
  }
  p._cleanupFns = [];
}

function deactivate(id: string): void {
  const p = _store[id];
  if (!p?._active) return;
  runCleanup(p);
  p._active = false;
}

function getConfig(id: string): Record<string, string | boolean | number> {
  const p = _store[id];
  if (!p?.config) return {};
  const raw = _cfgStore[id] ?? {};
  const result: PluginConfig = {};

  for (const field of p.config) {
    const val = raw[field.key];
    if (val === undefined) {
      result[field.key] = field.default;
      continue;
    }
    switch (field.type) {
      case "checkbox":
        result[field.key] = val === true || val === "true";
        break;
      case "number": {
        const n = typeof val === "number" ? val : parseFloat(String(val));
        result[field.key] = Number.isFinite(n) ? n : field.default;
        break;
      }
      default:
        result[field.key] = String(val);
    }
  }
  return result;
}

function loadConfigs(allConfigs: PluginConfigMap): void {
  _cfgStore = allConfigs ?? {};
}

export const XtensionAPI: XtensionAPIShape = {
  register,
  getAll,
  activate,
  deactivate,
  getConfig,
  loadConfigs,
  api: _api,
};

(window as unknown as {XtensionAPI: XtensionAPIShape}).XtensionAPI = XtensionAPI;
