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
  onCleanup(fn: () => void): void;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description?: string;
  author?: string;
  config?: PluginConfigField[];
  start?: (ctx: PluginContext) => void;
}

export interface PluginEntry extends PluginDefinition {
  _active: boolean;
  _cleanupFns: Array<() => void>;
}

export type PluginManifestEntry = Pick<PluginDefinition, "id" | "name" | "description" | "author" | "config">;

export type PluginConfigMap = Record<string, Record<string, string | boolean | number>>;
export type PluginStateMap = Record<string, boolean>;

export interface XtensionAPIShape {
  register(plugin: PluginDefinition): void;
  getAll(): PluginEntry[];
  activate(id: string): void;
  deactivate(id: string): void;
  getConfig(id: string): PluginConfig;
  loadConfigs(allConfigs: PluginConfigMap): void;
  _exports: Record<string, unknown>;
  getExport(id: string): unknown;
}
