"use client";

import { useEffect, useRef, useState } from "react";

type Source = "vidsrc" | "cinesrc" | "vidfast";

const sourceLabels: Record<Source, string> = { vidsrc: "VidSrc", cinesrc: "CineSrc", vidfast: "VidFast" };

export function MoviePlayer({ title, vidsrcUrl, cinesrcUrl, vidfastUrl }: { title: string; vidsrcUrl: string; cinesrcUrl: string; vidfastUrl: string }) {
  const [source, setSource] = useState<Source>("vidsrc");
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const sourceUrls: Record<Source, string> = { vidsrc: vidsrcUrl, cinesrc: cinesrcUrl, vidfast: vidfastUrl };

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (source !== "cinesrc" || event.origin !== "https://cinesrc.st" || event.source !== frameRef.current?.contentWindow) return;
      if (event.data && typeof event.data === "object" && event.data.type === "cinesrc:error") {
        setMessage("CineSrc reported a playback error. Try VidFast or reload the player.");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [source]);

  function selectSource(nextSource: Source) {
    setSource(nextSource);
    setMessage("");
  }

  function reloadPlayer() {
    setAttempt((value) => value + 1);
    setMessage("");
  }

  return (
    <>
      <div className="movies-player__sources" role="group" aria-label="Playback controls">
        <span>Server</span>
        <button type="button" aria-pressed={source === "vidsrc"} onClick={() => selectSource("vidsrc")}>VidSrc</button>
        <button type="button" aria-pressed={source === "cinesrc"} onClick={() => selectSource("cinesrc")}>CineSrc (backup)</button>
        <button type="button" aria-pressed={source === "vidfast"} onClick={() => selectSource("vidfast")}>VidFast (backup)</button>
        <button type="button" onClick={reloadPlayer}>Reload player</button>
        <small>If one server is unavailable, try either backup.</small>
      </div>
      <div className="movies-player__frame">
        <iframe
          key={`${source}:${attempt}`}
          ref={frameRef}
          src={sourceUrls[source]}
          title={`${title} on ${sourceLabels[source]}`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          // Keep embedded players from opening pop-under windows or navigating the portfolio.
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="origin"
          loading="lazy"
          onError={() => {
            if (source === "vidsrc") {
              setSource("cinesrc");
              setMessage("VidSrc could not load. Switched to the CineSrc backup.");
            } else if (source === "cinesrc") {
              setSource("vidfast");
              setMessage("CineSrc could not load. Switched to the VidFast backup.");
            } else {
              setMessage("VidFast could not load. Try another server or reload the player.");
            }
          }}
        />
      </div>
      {message && <p className="movies-player__message" role="status">{message}</p>}
    </>
  );
}
