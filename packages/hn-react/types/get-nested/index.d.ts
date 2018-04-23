declare module 'get-nested' {
  function getNested<V, F>(getValue: () => V, fallback: F): V | F;
  function getNested<V>(getValue: () => V): V | false;

  export = getNested;
}
