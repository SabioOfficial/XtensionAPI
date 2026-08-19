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
  _store[plugin.id] = {...plugin, _active: false, _cleanupFns: [], _configListeners: [], _lastConfig: {}};
}

const getAll = (): PluginEntry[] => Object.values(_store);

function activate(id: string, _visiting = new Set<string>()): void {
  const p = _store[id];
  if (!p || p._active) return;

  if (_visiting.has(id)) {
    console.warn(`[XtensionAPI | Plugin Registrar] Circular dependsOn involving "${id}". Activating without further ordering.`);
  } else {
    _visiting.add(id);
    for (const depId of p.dependsOn ?? []) {
      if (_store[depId] && !_store[depId]._active) activate(depId, _visiting);
    }
    _visiting.delete(id);
  }

  p._cleanupFns = [];
  p._configListeners = [];
  p._lastConfig = getConfig(id);

  const ctx: PluginContext = {
    id: p.id,
    config: p._lastConfig,
    api: _api,
    onCleanup(fn) {
      p._cleanupFns.push(fn);
    },
    onConfigChange(fn) {
      p._configListeners.push(fn);
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
  p._configListeners = [];
}

function deactivate(id: string): void {
  const p = _store[id];
  if (!p?._active) return;
  runCleanup(p);
  p._active = false;
}

function setConfig(id: string, config: PluginConfig): void {
  _cfgStore[id] = config;
  const p = _store[id];
  if (!p?._active) return;

  const next = getConfig(id);
  const prev = p._lastConfig;
  p._lastConfig = next;
  for (const listener of p._configListeners) {
    try {
      listener(next, prev);
    } catch (err) {
      console.warn(`[XtensionAPI | Plugin Registrar] Plugin "${id}" config listener threw:`, err);
    }
  }
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
  setConfig,
  api: _api,
};

(window as unknown as {XtensionAPI: XtensionAPIShape}).XtensionAPI = XtensionAPI;
