import type { PluginConfigMap, PluginStateMap } from "./types";
import { XtensionAPI } from "./registry";

declare const chrome: any;

chrome.storage.sync.get(["pluginStates", "pluginConfig"], (data: any) => {
  const states: PluginStateMap = data.pluginStates ?? {};
  const configs: PluginConfigMap = data.pluginConfig ?? {};
  XtensionAPI.loadConfigs(configs);

  for (const plugin of XtensionAPI.getAll()) {
    if (states[plugin.id] === true) XtensionAPI.activate(plugin.id);
  }
});
