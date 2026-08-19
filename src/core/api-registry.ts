import type { ApiMethodMap, ApiRegistry } from "./types";

export function createApiRegistry(): ApiRegistry {
  const methods = new Map<keyof ApiMethodMap, (...args: unknown[]) => unknown>();

  return {
    register(name, fn) {
      if (methods.has(name)) {
        console.warn(`[XtensionAPI] Method "${String(name)}" is already registered. Overwriting.`);
      }
      methods.set(name, fn as (...args: unknown[]) => unknown);
    },

    unregister(name) {
      methods.delete(name);
    },

    has: (name) => methods.has(name),

    call(name, ...args) {
      const fn = methods.get(name);
      if (!fn) {
        throw new Error(`[XtensionAPI] Required method "${String(name)}" is not registered. Is the providing plugin active?`)
      }
      return fn(...args) as ReturnType<ApiMethodMap[typeof name]>;
    },

    callOptional(name, ...args) {
      const fn = methods.get(name);
      if (!fn) return null;
      try {
        return fn(...args) as ReturnType<ApiMethodMap[typeof name]>;
      } catch (err) {
        console.warn(`[XtensionAPI] Optional method "${String(name)}" threw:`, err);
        return null;
      }
    },
  };
}
