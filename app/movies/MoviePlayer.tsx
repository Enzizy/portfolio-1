"use client";

import { useEffect, useRef, useState } from "react";

type Source = "vidsrc" | "cinesrc";

export function MoviePlayer({ title, vidsrcUrl, cinesrcUrl }: { title: string; vidsrcUrl: string; cinesrcUrl: string }) {
  const [source, setSource] = useState<Source>("vidsrc");
  const [message, setMessage] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (source !== "cinesrc" || event.origin !== "https://cinesrc.st" || event.source !== frameRef.current?.contentWindow) return;
      if (event.data && typeof event.data === "object" && event.data.type === "cinesrc:error") {
        setMessage("CineSrc reported a playback error. Try VidSrc instead.");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [source]);

  function selectSource(nextSource: Source) {
    setSource(nextSource);
    setMessage("");
  }

  return (
    <>
      <div className="movies-player__sources" role="group" aria-label="Playback server">
        <span>Server</span>
        <button type="button" aria-pressed={source === "vidsrc"} onClick={() => selectSource("vidsrc")}>VidSrc</button>
        <button type="button" aria-pressed={source === "cinesrc"} onClick={() => selectSource("cinesrc")}>CineSrc</button>
        <small>If one server is unavailable, try the other.</small>
      </div>
      <div className="movies-player__frame">
        <iframe
          key={source}
          ref={frameRef}
          src={source === "vidsrc" ? vidsrcUrl : cinesrcUrl}
          title={`${title} on ${source === "vidsrc" ? "VidSrc" : "CineSrc"}`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          // Keep embedded players from opening pop-under windows or navigating the portfolio.
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="origin"
          loading="lazy"
          onError={() => {
            if (source === "vidsrc") {
              setSource("cinesrc");
              setMessage("VidSrc could not load. Switched to CineSrc.");
            } else {
              setMessage("CineSrc could not load. Try VidSrc instead.");
            }
          }}
        />
      </div>
      {message && <p className="movies-player__message" role="status">{message}</p>}
    </>
  );
}
