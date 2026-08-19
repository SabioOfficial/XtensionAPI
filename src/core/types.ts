export interface PluginConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  default: string | boolean | number;
  placeholder?: string;
  options?: Array<string | {value: string; label: string}>;
  showIf?: {key: string; value: string};
}

export type PluginConfig = Record<string, string | boolean | number>;

export interface PluginContext {
  id: string;
  config: PluginConfig;
  api: ApiRegistry;
  onCleanup(fn: () => void): void;
  onConfigChange(fn: (next: PluginConfig, prev: PluginConfig) => void): void;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description?: string;
  author?: string;
  config?: PluginConfigField[];
  dependsOn?: string[];
  start?: (ctx: PluginContext) => void;
}

export interface PluginEntry extends PluginDefinition {
  _active: boolean;
  _cleanupFns: Array<() => void>;
  _configListeners: Array<(next: PluginConfig, prev: PluginConfig) => void>;
  _lastConfig: PluginConfig;
}

export type PluginManifestEntry = Pick<PluginDefinition, "id" | "name" | "description" | "author" | "config">;

export type PluginConfigMap = Record<string, Record<string, string | boolean | number>>;
export type PluginStateMap = Record<string, boolean>;

export interface ApiMethodMap { }

export interface ApiRegistry {
  register<K extends keyof ApiMethodMap>(name: K, fn: ApiMethodMap[K]): void;
  unregister(name: keyof ApiMethodMap): void;
  has(name: keyof ApiMethodMap): boolean;
  call<K extends keyof ApiMethodMap>(name: K, ...args: Parameters<ApiMethodMap[K]>): ReturnType<ApiMethodMap[K]>;
  callOptional<K extends keyof ApiMethodMap>(name: K, ...args: Parameters<ApiMethodMap[K]>): ReturnType<ApiMethodMap[K]> | null;
}

export interface XtensionAPIShape {
  register(plugin: PluginDefinition): void;
  getAll(): PluginEntry[];
  activate(id: string): void;
  deactivate(id: string): void;
  getConfig(id: string): PluginConfig;
  loadConfigs(allConfigs: PluginConfigMap): void;
  setConfig(id: string, config: PluginConfig): void;
  api: ApiRegistry;
}
