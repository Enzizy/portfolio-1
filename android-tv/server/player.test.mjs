import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script = readFileSync(new URL("../app/src/main/assets/player.js", import.meta.url), "utf8");
function player({ source = "cinesrc", embed = "https://cinesrc.st/embed/movie/27205" } = {}) {
  const events = [];
  const commands = [];
  const handlers = {};
  const frame = { contentWindow: { postMessage: (data, origin) => commands.push({ data, origin }) }, addEventListener: () => {} };
  const window = { ScreenRoom: { postMessage: data => events.push(JSON.parse(data).type) }, addEventListener: (event, handler) => { handlers[event] = handler; } };
  const context = { window, document: { getElementById: () => frame }, location: { search: '?' + new URLSearchParams({ source, embed }) }, URL, URLSearchParams };
  vm.runInNewContext(script, context);
  const message = (data, origin = "https://cinesrc.st", sourceWindow = frame.contentWindow) => handlers.message?.({ data, origin, source: sourceWindow });
  return { window, events, commands, frame, message };
}

test("player rejects off-origin embed URLs", () => {
  const result = player({ embed: "https://cinesrc.st.attacker.test/embed/movie/1" });
  assert.deepEqual(result.events, ['error']);
  assert.equal(result.frame.src, undefined);
});

test("only the active provider frame can send playback events", () => {
  const p = player();
  p.message({ type: 'cinesrc:error' }, 'https://untrusted.test');
  p.message({ type: 'cinesrc:error' }, 'https://cinesrc.st', {});
  assert.deepEqual(p.events, []);
  p.message({ type: 'cinesrc:play' });
  p.window.screenRoomControl('toggle');
  assert.equal(p.commands[0].data.command, 'pause');
  assert.equal(p.commands[0].origin, 'https://cinesrc.st');
});

test("remote seeks are clamped to the available playback duration", () => {
  const p = player();
  p.message({ type: 'cinesrc:timeupdate', currentTime: 95, duration: 100 });
  p.window.screenRoomControl('forward');
  assert.equal(p.commands[0].data.args[0], 100);
  p.message({ type: 'cinesrc:timeupdate', currentTime: 3, duration: 100 });
  p.window.screenRoomControl('rewind');
  assert.equal(p.commands[1].data.args[0], 0);
});

test("VidSrc never receives CineSrc commands", () => {
  const p = player({ source: 'vidsrc', embed: 'https://vidsrc.sbs/embed/tv/1396/1/2' });
  p.window.screenRoomControl('toggle');
  p.message({ type: 'cinesrc:error' });
  assert.equal(p.commands.length, 0);
  assert.equal(p.events.length, 0);
  assert.equal(p.frame.src, 'https://vidsrc.sbs/embed/tv/1396/1/2');
});
