// Fix for AI Studio iframe environment where window.fetch is a getter-only property.
// This prevents errors when third-party libraries (like formdata-polyfill) try to assign to window.fetch or globalThis.fetch.
(() => {
  const patchFetch = (target: any) => {
    try {
      if (!target) return;
      let descriptor = Object.getOwnPropertyDescriptor(target, 'fetch');
      if (!descriptor) {
        // Try finding on the prototype chain
        let proto = Object.getPrototypeOf(target);
        while (proto && !descriptor) {
          descriptor = Object.getOwnPropertyDescriptor(proto, 'fetch');
          if (!descriptor) {
            proto = Object.getPrototypeOf(proto);
          }
        }
      }

      if (descriptor && !descriptor.set) {
        let currentFetch = target.fetch;
        Object.defineProperty(target, 'fetch', {
          configurable: true,
          enumerable: true,
          get() {
            return currentFetch;
          },
          set(val) {
            currentFetch = val;
          }
        });
      }
    } catch (e) {
      console.warn("Unable to patch fetch on", target, e);
    }
  };

  patchFetch(window);
  patchFetch(globalThis);
  patchFetch(self);
})();

export {};
