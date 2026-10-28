"use client";

import { useEffect, useRef, useState } from "react";

export function MoviePlayer({ title, cinesrcUrl }: { title: string; cinesrcUrl: string }) {
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== "https://cinesrc.st" || event.source !== frameRef.current?.contentWindow) return;
      if (event.data && typeof event.data === "object" && event.data.type === "cinesrc:error") {
        setMessage("CineSrc reported a playback error. Reload the player to try again.");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function reloadPlayer() {
    setAttempt((value) => value + 1);
    setMessage("");
  }

  return (
    <>
      <div className="movies-player__sources" role="group" aria-label="Playback controls">
        <span>CineSrc</span>
        <button type="button" onClick={reloadPlayer}>Reload player</button>
        <small>If playback stalls, reload the player to try again.</small>
      </div>
      <div className="movies-player__frame">
        <iframe
          key={`${cinesrcUrl}:${attempt}`}
          ref={frameRef}
          src={cinesrcUrl}
          title={`${title} on CineSrc`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          // Keep embedded players from opening pop-under windows or navigating the portfolio.
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="origin"
          loading="lazy"
          onError={() => setMessage("CineSrc could not load. Reload the player to try again.")}
        />
      </div>
      {message && <p className="movies-player__message" role="status">{message}</p>}
    </>
  );
}
