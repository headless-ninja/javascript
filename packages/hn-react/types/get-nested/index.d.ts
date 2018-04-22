declare module 'get-nested' {
  function getNested<V, F>(getValue: () => V, fallback?: F): V | F;

  export = getNested;
}
