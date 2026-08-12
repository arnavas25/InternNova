import { useEffect, useState } from 'react';

const loaded = new Set();

export default function useExternalScript(src) {
  const [ready, setReady] = useState(loaded.has(src));

  useEffect(() => {
    if (loaded.has(src)) { setReady(true); return; }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => { loaded.add(src); setReady(true); };
    document.body.appendChild(script);
    return () => {};
  }, [src]);

  return ready;
}
