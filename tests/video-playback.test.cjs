const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function setup(reduced, legacy = false) {
  class Element {
    constructor() { this.listeners = {}; this.hidden = false; this.children = []; this.attrs = {}; }
    appendChild(child) { this.children.push(child); child.parentNode = this; }
    insertBefore(child) { this.appendChild(child); }
    setAttribute(key, value) { this.attrs[key] = value; }
    getAttribute(key) { return this.attrs[key]; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    emit(name) { this.listeners[name]?.(); }
    focus() { document.activeElement = this; }
  }
  const videos = [new Element(), new Element()];
  videos.forEach((video, i) => {
    new Element().appendChild(video);
    video.poster = `poster-${i}.jpg`;
    video.attrs['aria-label'] = `Kevin ${i}`;
    video.paused = true;
    video.calls = 0;
    video.pause = () => { video.paused = true; video.emit('pause'); };
    video.play = () => {
      video.calls++;
      if (video.pending) return new Promise(resolve => { video.resolve = resolve; });
      if (video.blocked) return Promise.reject(new Error('blocked'));
      video.paused = false; video.emit('play'); return Promise.resolve();
    };
  });
  const document = {
    querySelector: () => null,
    querySelectorAll: () => videos,
    createElement: () => new Element(),
    activeElement: null,
  };
  const motion = { matches: reduced };
  motion[legacy ? 'addListener' : 'addEventListener'] = (...args) => { motion.changed = args.at(-1); };
  const context = { document, window: { matchMedia: () => motion }, Promise };
  function run() { vm.runInNewContext(fs.readFileSync('site.js', 'utf8'), context); }
  return { videos, motion, document, run, change(value) { motion.matches = value; motion.changed(); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const controls = video => video.parentNode.children.slice(1);

test('reduced motion: posters, labeled buttons, manual non-looping play and pause', async () => {
  const env = setup(true); env.run();
  for (const video of env.videos) {
    const [poster, button] = controls(video);
    assert.equal(video.calls, 0); assert.equal(video.loop, false);
    assert.equal(poster.hidden, false); assert.match(button.attrs['aria-label'], /Kevin/);
    env.document.activeElement = button;
    button.emit('click'); await tick();
    assert.equal(video.paused, false); assert.equal(video.controls, true);
    assert.equal(poster.hidden, true); assert.equal(button.hidden, true);
    assert.equal(env.document.activeElement, video);
    video.pause(); assert.equal(button.hidden, false);
    video.emit('ended'); assert.equal(button.hidden, false);
  }
});
test('normal preference autoplays and loops both videos', async () => {
  const env = setup(false); env.run(); await tick();
  env.videos.forEach(video => {
    assert.equal(video.calls, 1); assert.equal(video.loop, true);
    assert.equal(video.controls, false); assert.equal(controls(video)[1].hidden, true);
  });
});
test('blocked autoplay and blocked manual retries keep usable controls', async () => {
  const env = setup(false); env.videos.forEach(v => v.blocked = true);
  env.run(); await tick();
  for (const video of env.videos) {
    const button = controls(video)[1]; assert.equal(button.hidden, false);
    button.emit('click'); await tick(); assert.equal(button.hidden, false);
    video.blocked = false; button.emit('click'); await tick();
    assert.equal(button.hidden, true); assert.equal(video.controls, true);
  }
});
test('live preference changes pause, restore posters, and resume eligible autoplay', async () => {
  const env = setup(false, true); env.run(); await tick();
  env.change(true);
  env.videos.forEach(video => {
    assert.equal(video.paused, true); assert.equal(video.loop, false);
    assert.equal(controls(video)[0].hidden, false);
  });
  env.change(false); await tick();
  env.videos.forEach(video => assert.equal(video.paused, false));
});
test('late autoplay resolution cannot hide reduced-motion posters or restart playback', async () => {
  const env = setup(false); env.videos.forEach(v => v.pending = true);
  env.run(); env.change(true);
  env.videos.forEach(video => { video.paused = false; video.emit('play'); video.resolve(); });
  await tick();
  env.videos.forEach(video => {
    assert.equal(video.paused, true); assert.equal(controls(video)[0].hidden, false);
    assert.equal(controls(video)[1].hidden, false);
  });
});
test('HTML never autoplays before JS and retains posters and no-JS controls', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const videos = html.match(/<video\b[^>]*>/g);
  assert.equal(videos.length, 2);
  videos.forEach(tag => {
    assert.doesNotMatch(tag, /\bautoplay\b/);
    for (const attr of ['poster=', 'data-auto-video', 'controls', 'playsinline']) assert.ok(tag.includes(attr));
  });
});
