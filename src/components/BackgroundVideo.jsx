import { useEffect, useRef, useState } from 'react';

const VIDEO_SOURCE =
  'https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8';

function BackgroundVideo() {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let cancelled = false;
    let hls;
    let idleCallbackId;
    let startTimer;

    const requestPlayback = () => {
      video.play().catch(() => undefined);
    };

    const handleMediaReady = () => {
      if (cancelled) return;
      setIsReady(true);
      requestPlayback();
    };

    video.addEventListener('canplay', handleMediaReady);
    video.addEventListener('loadeddata', handleMediaReady);

    const initializeVideo = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = VIDEO_SOURCE;
        return;
      }

      try {
        const Hls = (await import('hls.js/light')).default;
        if (cancelled || !Hls.isSupported()) return;

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });

        hls.loadSource(VIDEO_SOURCE);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, requestPlayback);
      } catch {
        // The video is decorative; the layered visual fallback remains visible.
      }
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData === true;

    if (!reducedMotion && !saveData) {
      startTimer = window.setTimeout(() => {
        if ('requestIdleCallback' in window) {
          idleCallbackId = window.requestIdleCallback(initializeVideo, { timeout: 1000 });
        } else {
          initializeVideo();
        }
      }, 550);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (idleCallbackId) window.cancelIdleCallback?.(idleCallbackId);
      video.removeEventListener('canplay', handleMediaReady);
      video.removeEventListener('loadeddata', handleMediaReady);
      hls?.destroy();
    };
  }, []);

  return (
    <div className="background-media fixed inset-0 -z-20" aria-hidden="true">
      <div className="background-video-poster absolute inset-0" />
      <video
        ref={videoRef}
        className={`background-video absolute inset-0 h-full w-full scale-[1.025] object-cover${isReady ? ' is-ready' : ''}`}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/medilens-poster.svg"
      />
    </div>
  );
}

export default BackgroundVideo;
