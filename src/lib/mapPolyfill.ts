// Newer PDF engine uses Map/WeakMap.getOrInsert(Computed), missing in many mobile browsers.
for (const Ctor of [Map, WeakMap] as unknown as Array<{ prototype: Record<string, unknown> }>) {
  const proto = Ctor.prototype as any;
  if (!proto.getOrInsertComputed) {
    proto.getOrInsertComputed = function (key: unknown, fn: (k: unknown) => unknown) {
      if (!this.has(key)) this.set(key, fn(key));
      return this.get(key);
    };
  }
  if (!proto.getOrInsert) {
    proto.getOrInsert = function (key: unknown, value: unknown) {
      if (!this.has(key)) this.set(key, value);
      return this.get(key);
    };
  }
}
export {};
