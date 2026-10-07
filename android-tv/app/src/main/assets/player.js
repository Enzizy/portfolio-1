(() => {
  const frame = document.getElementById('player');
  const config = new URLSearchParams(location.search);
  const source = config.get('source');
  const notify = type => window.ScreenRoom?.postMessage(JSON.stringify({ type }));
  let url;
  try { url = new URL(config.get('embed')); } catch { notify('error'); return; }
  const expectedOrigin = source === 'cinesrc' ? 'https://cinesrc.st' : source === 'vidsrc' ? 'https://vidsrc.sbs' : null;
  if (!expectedOrigin || url.origin !== expectedOrigin || url.username || url.password ||
      !/^\/embed\/(movie|tv)\/[1-9]\d*(\/\d+\/\d+)?$/.test(url.pathname)) {
    notify('error');
    return;
  }
  let paused = true;
  let currentTime = 0;
  let duration = 0;
  const command = (command, args = []) => frame.contentWindow?.postMessage({ type: 'cinesrc:command', command, args }, 'https://cinesrc.st');
  window.screenRoomControl = action => {
    if (source !== 'cinesrc') return;
    if (action === 'toggle') command(paused ? 'play' : 'pause');
    if (action === 'play' || action === 'pause') command(action);
    if (action === 'forward' || action === 'rewind') {
      const next = Math.max(0, currentTime + (action === 'forward' ? 10 : -10));
      command('seek', [duration > 0 ? Math.min(duration, next) : next]);
    }
  };
  window.addEventListener('message', event => {
    if (source !== 'cinesrc' || event.origin !== 'https://cinesrc.st' || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'cinesrc:play') { paused = false; notify('playing'); }
    if (data.type === 'cinesrc:pause') { paused = true; notify('paused'); }
    if (data.type === 'cinesrc:timeupdate') {
      if (Number.isFinite(data.currentTime)) currentTime = Math.max(0, data.currentTime);
      if (Number.isFinite(data.duration)) duration = Math.max(0, data.duration);
    }
    if (data.type === 'cinesrc:ready') notify('ready');
    if (data.type === 'cinesrc:error') notify('error');
  });
  frame.addEventListener('load', () => notify('loaded'));
  frame.src = url.href;
})();
