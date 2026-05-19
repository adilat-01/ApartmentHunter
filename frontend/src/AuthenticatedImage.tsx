import { useEffect, useState } from 'react';
import { fetchImageBlobUrl } from './api';

interface AuthenticatedImageProps {
  path: string;
  alt: string;
  className?: string;
}

export default function AuthenticatedImage({
  path,
  alt,
  className,
}: AuthenticatedImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      setSrc(path);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetchImageBlobUrl(path)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => setSrc(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!src) {
    return (
      <div
        className={`bg-stone-100 animate-pulse rounded-xl ${className ?? 'w-20 h-20'}`}
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
