import React, { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { removeWhiteBackground } from '../utils/imageCutout';

interface ProcessedSpriteProps {
  src: string;
  alt: string;
  className?: string;
  transparentBg?: boolean;
  fallbackLabel?: string;
}

export const ProcessedSprite: React.FC<ProcessedSpriteProps> = ({
  src,
  alt,
  className = '',
  transparentBg = true,
  fallbackLabel,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);
    setResolvedSrc(src);

    if (transparentBg) {
      removeWhiteBackground(src).then((cutoutUrl) => {
        if (active) {
          setResolvedSrc(cutoutUrl);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [src, transparentBg]);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-yellow-50 to-sky-100 p-3 text-[#2B2D42] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Car className="h-8 w-8 text-pink-500" />
        {fallbackLabel ? (
          <span className="mt-1 text-xs font-bold">{fallbackLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
