import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appbar, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera } from '../api/frigateApi';
const SESSION_COOKIE_KEY = 'aivms_session_cookie';
const BASE_URL = 'https://aivms.shrotitele.com';
// ─── Debug logging (never prints the full secret) ─────────────────────────────
const log = (...args: any[]) => console.log('[STREAM]', ...args);
const maskValue = (v: string) =>
  v ? `${v.slice(0, 3)}…(${v.length} chars)` : '(empty)';
const parseCookieString = (raw: string) =>
  raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf('=');
      return i < 0
        ? { name: pair.trim(), value: '' }
        : { name: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim() };
    })
    .filter((c) => c.name);
/*
 * ZOOM + PAN (shared by the MJPEG and LIVE pages). Defines window.__setZoom(z)
 * which RN calls via injectJavaScript, and lets the user drag to pan while zoomed.
 * Works on <video id="video"> (LIVE) and <img id="stream"> (MJPEG).
 */
const ZOOM_PAN_JS = `
  var _zScale = 1, _zpx = 0, _zpy = 0;
  function _zEl(){ return document.getElementById('video') || document.getElementById('stream'); }
  function _zApply(){
    var el = _zEl();
    if (!el) return;
    if (_zScale <= 1){
      // DEFAULT VIEW: remove the transform ENTIRELY. Applying a CSS transform (or
      // will-change) to a <video> promotes it to its own compositing layer, which
      // makes the Android WebView hardware video surface render BLANK/BLACK even
      // though playback keeps going. At 1x we must leave the element untouched so
      // it renders exactly like before the zoom feature existed.
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.willChange = '';
    } else {
      // Zoomed in: plain scale + pan translate. NO will-change (that was the blanker).
      el.style.transformOrigin = 'center center';
      el.style.transform = 'translate(' + _zpx + 'px,' + _zpy + 'px) scale(' + _zScale + ')';
    }
  }
  window.__setZoom = function(z){
    z = Math.max(1, Math.min(4, z || 1));
    _zScale = z;
    if (_zScale <= 1){ _zpx = 0; _zpy = 0; }
    _zApply();
  };
  (function(){
    var d = false, sx = 0, sy = 0, ox = 0, oy = 0;
    document.addEventListener('touchstart', function(e){
      if (_zScale > 1 && e.touches.length === 1){ d = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; ox = _zpx; oy = _zpy; }
    }, { passive: true });
    document.addEventListener('touchmove', function(e){
      if (d && e.touches.length === 1){ _zpx = ox + (e.touches[0].clientX - sx); _zpy = oy + (e.touches[0].clientY - sy); _zApply(); }
    }, { passive: true });
    document.addEventListener('touchend', function(){ d = false; }, { passive: true });
  })();
`;
const InfoRow = ({ icon, label, value, valueColor }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Icon name={icon} size={18} color="#3b82f6" />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}
      >
        {value || '—'}
      </Text>
    </View>
  </View>
);
const formatHeartbeat = (hb: string | null) => {
  if (!hb) return 'Never';
  try {
    const d = new Date(hb.replace(' ', 'T'));
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return hb;
  }
};
export const CameraDetailsScreen = ({ route, navigation }: any) => {
  const { camera } = route.params as { camera: Camera };
  // API kabhi 1, "1" ya true bhej sakti hai
  const isActive = Boolean(
    camera.is_active === 1 ||
    String(camera.is_active) === '1' ||
    String(camera.is_active) === 'true',
  );
  // 'live' = go2rtc stream.mp4 played by the phone's NATIVE <video> decoder
  const [streamMethod, setStreamMethod] =
    useState<'mjpeg' | 'live' | 'rtsp'>('live');
  const [cookieReady, setCookieReady] = useState(false);
  const [sessionCookie, setSessionCookie] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState(0);
  /*
   * ZOOM + FULLSCREEN — added so you can verify the stream is LIVE (not frozen):
   * zoom into the trees and watch whether the leaves move. Zoom is applied by
   * INJECTING into the same WebView (window.__setZoom) — the player is NOT
   * remounted, so the live socket is never interrupted. zoomRef mirrors `zoom`
   * so we can re-apply the current zoom after a (re)load without making it a
   * memo dependency of the player.
   */
  const webViewRef = useRef<any>(null);
  const zoomRef = useRef(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /*
   * AUDIO — the <video> starts `muted` (muted autoplay ALWAYS works, so the
   * picture never blanks). The speaker button unmutes on an explicit user tap.
   * mutedRef mirrors `muted` so the choice is re-applied after the remount that
   * entering/exiting fullscreen causes.
   */
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  /*
   * FULLSCREEN ROTATE — rotate the player 90° (portrait phone → landscape view)
   * using an RN transform on the CONTAINER View. We never put a CSS transform on
   * the <video> itself (that blanks the Android hardware surface), and we need no
   * native orientation library. Controls stay upright; only the video rotates.
   */
  const [fsRotated, setFsRotated] = useState(false);
  const { width: winW, height: winH } = useWindowDimensions();
  const applyZoom = useCallback((z: number) => {
    zoomRef.current = z;
    const wv = webViewRef.current;
    if (wv && wv.injectJavaScript) {
      wv.injectJavaScript(
        `try{window.__setZoom&&window.__setZoom(${z});}catch(e){} true;`,
      );
    }
  }, []);
  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10));
  }, []);
  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10));
  }, []);
  // Push zoom into the page whenever it changes.
  useEffect(() => {
    applyZoom(zoom);
  }, [zoom, applyZoom]);
  // Unmute/mute the <video> by injecting into the same page (no remount, no
  // socket/stream interruption) — exactly like applyZoom.
  const applyMute = useCallback((m: boolean) => {
    mutedRef.current = m;
    const wv = webViewRef.current;
    if (wv && wv.injectJavaScript) {
      wv.injectJavaScript(
        `try{window.__setMute&&window.__setMute(${m ? 'true' : 'false'});}catch(e){} true;`,
      );
    }
  }, []);
  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);
  // Push the mute state into the page whenever it changes (a tap is the gesture
  // the WebView needs before sound is allowed to play).
  useEffect(() => {
    applyMute(muted);
  }, [muted, applyMute]);
  // A method switch / retry remounts the player at 1x + muted, so reset that UI.
  // (Toggling fullscreen deliberately PRESERVES zoom + mute — see onWebViewLoad.)
  useEffect(() => {
    zoomRef.current = 1;
    setZoom(1);
    mutedRef.current = true;
    setMuted(true);
  }, [streamMethod, streamKey]);
  // Leaving fullscreen always returns to the normal (un-rotated) orientation.
  useEffect(() => {
    if (!isFullscreen) setFsRotated(false);
  }, [isFullscreen]);
  // The page always starts at 1x + muted, so after any (re)load re-apply the
  // current zoom AND mute state (this also restores them after the remount caused
  // by entering/exiting fullscreen).
  const onWebViewLoad = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !wv.injectJavaScript) return;
    if (zoomRef.current !== 1) {
      wv.injectJavaScript(
        `try{window.__setZoom&&window.__setZoom(${zoomRef.current});}catch(e){} true;`,
      );
    }
    if (mutedRef.current === false) {
      wv.injectJavaScript(
        `try{window.__setMute&&window.__setMute(false);}catch(e){} true;`,
      );
    }
  }, []);
  /*
   * STREAM IDENTIFIER
   * Must match what the WORKING WEBSITE requests (check browser DevTools → Network).
   * If the site uses a different value, change ONLY this line.
   */
  const streamId = camera.camera_key;
  /*
   * LIVE (go2rtc MSE) over WebSocket — kept here only for the Stream URLs card /
   * logging reference. Actual playback now uses the native stream.mp4 URL below.
   */
  const liveWsUrls = useMemo(() => {
    const wsBase = BASE_URL.replace(/^http/, 'ws');
    const src = encodeURIComponent(streamId);
    return [
      `${wsBase}/api/go2rtc/api/ws?src=${src}`, // direct go2rtc through Frigate
      `${wsBase}/live/mse/api/ws?src=${src}`,   // Frigate's own MSE live path
      `${wsBase}/api/ws?src=${src}`,            // go2rtc mounted at root
    ];
  }, [streamId]);
  const liveWsUrl = liveWsUrls[0]; // primary (shown in the Stream URLs card)
  /*
   * LIVE playback URL — go2rtc's continuous fMP4 (stream.mp4) handed straight to
   * the phone's NATIVE <video> hardware decoder. This is what actually renders on
   * this device (the WebView MSE path could not decode the H.265 feed). Same-origin,
   * so the frigate_token cookie rides along automatically.
   */
  const liveMp4Url = useMemo(() => {
    const src = encodeURIComponent(streamId);
    // audio=all is now requested on the SAME url as the video. This plays
    // through the WebView's <video> element (Chromium engine), not through
    // Android's native ExoPlayer/MediaCodec. The camera's audio codec is
    // FLAC @ 8000Hz, which Android's system FLAC decoder (c2.android.flac.decoder)
    // could not reliably decode (confirmed via device logs — repeated
    // ERROR_CODE_DECODING_FAILED). Chromium ships its own software FLAC
    // decoder and plays it fine — exactly like it already works on the
    // desktop website in Chrome. Keeping video+audio in one element also
    // means they're natively in sync.
    return `${BASE_URL}/api/go2rtc/api/stream.mp4?src=${src}&video=all&audio=all`;
  }, [streamId]);
  /*
   * MJPEG URL (fallback still view). Frigate-style endpoint.
   * If this returns a green screen, it indicates Frigate's backend ffmpeg is failing to decode the H.265 stream.
   */
  const mjpegUrl = `${BASE_URL}/api/${encodeURIComponent(streamId)}?fps=15`;
  const rtspUrl = `rtsp://aivms.shrotitele.com:8554/${streamId}`;
  /*
   * LOG CAMERA + URLS ONCE
   */
  useEffect(() => {
    log('CAMERA SELECTED:', {
      id: camera.id,
      camera_name: camera.camera_name,
      camera_key: camera.camera_key,
      is_active: camera.is_active,
      isActive,
    });
    log('STREAM IDENTIFIER USED:', streamId);
    log('LIVE (MP4) URL:', liveMp4Url);
    log('LIVE (MSE) WS CANDIDATES:', liveWsUrls.join('  |  '));
    log('MJPEG URL:', mjpegUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);
  /*
   * LOAD SESSION COOKIE (from AsyncStorage) — injected into the stream page so
   * the WebSocket handshake / image request stay authenticated. No native module.
   */
  useEffect(() => {
    let mounted = true;
    const loadCookie = async () => {
      try {
        const cookie = await AsyncStorage.getItem(SESSION_COOKIE_KEY);
        log('SESSION COOKIE EXISTS:', !!cookie);
        if (cookie) {
          const parsed = parseCookieString(cookie);
          log(
            'COOKIE FORMAT (masked):',
            parsed.map((c) => `${c.name}=${maskValue(c.value)}`).join('; '),
          );
          if (mounted) setSessionCookie(cookie);
        }
      } catch (error) {
        log('COOKIE LOAD ERROR:', error);
      } finally {
        if (mounted) setCookieReady(true);
      }
    };
    loadCookie();
    return () => {
      mounted = false;
    };
  }, []);
  // Retry = the ONLY thing that remounts the player (besides a method switch).
  const retryStream = useCallback(() => {
    log('RETRY requested by user');
    setStreamKey((prev) => prev + 1);
  }, []);
  /*
   * WEBVIEW EVENT HANDLERS (stable identities so the player never remounts)
   */
  const onStreamMessage = useCallback((event: any) => {
    // Log the RAW json string (NOT the parsed object). React Native DevTools
    // collapses objects to the word "Object", which hid the event type before.
    // A plain string prints inline, e.g.  [STREAM] WEBVIEW EVENT: {"type":"PLAYING"}
    log('WEBVIEW EVENT:', event?.nativeEvent?.data);
  }, []);
  const onLoadStart = useCallback(() => {
    // If this fires every ~1s, the player is being remounted (not just buffering).
    log('WEBVIEW onLoadStart (full page load)');
  }, []);
  const onWebViewError = useCallback((event: any) => {
    const e = event?.nativeEvent || {};
    log('WEBVIEW ERROR:', { code: e.code, description: e.description, url: e.url });
  }, []);
  const onWebViewHttpError = useCallback((event: any) => {
    const e = event?.nativeEvent || {};
    log('WEBVIEW HTTP ERROR:', {
      statusCode: e.statusCode,
      url: e.url,
      description: e.description,
    });
  }, []);
  // Best-effort cookie injection for the stream page (shared by MJPEG + LIVE).
  // Harmless if the streams are public.
  const cookieInjection = useMemo(() => {
    if (!sessionCookie) return 'true;';
    const parts = parseCookieString(sessionCookie);
    return (
      parts
        .map(
          (c) =>
            `try{document.cookie=${JSON.stringify(
              `${c.name}=${c.value}; path=/`,
            )};}catch(e){}`,
        )
        .join('') + 'true;'
    );
  }, [sessionCookie]);
  /*
   * MJPEG HTML — rendered inside an <img> (Android WebView will NOT render a raw
   * multipart/x-mixed-replace stream as the top-level document → that was the
   * green/blank screen). Inside an <img> it renders reliably.
   */
  const mjpegHtml = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
#wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
#stream { width: 100%; height: 100%; object-fit: contain; background: #000; }
#status { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); color: #9ca3af; font-family: sans-serif; font-size: 13px; text-align: center; padding: 0 16px; }
</style>
</head>
<body>
<div id="wrap"><img id="stream" /></div>
<div id="status">Connecting to camera...</div>
<script>
${ZOOM_PAN_JS}
  function post(t, e){ try { window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:t}, e||{}))); } catch(x){} }
  var img = document.getElementById('stream');
  var statusEl = document.getElementById('status');
  img.onload = function(){ statusEl.style.display='none'; post('MJPEG_FIRST_FRAME'); };
  img.onerror = function(){ statusEl.innerHTML = '⚠ Unable to load stream (check MJPEG URL / auth)'; post('MJPEG_ERROR'); };
  post('MJPEG_START', { url: ${JSON.stringify(mjpegUrl)} });
  img.src = ${JSON.stringify(mjpegUrl)};
</script>
</body>
</html>`,
    [mjpegUrl],
  );
  const mjpegSource = useMemo(
    () => ({ html: mjpegHtml, baseUrl: BASE_URL }),
    [mjpegHtml],
  );
  /*
   * LIVE HTML — go2rtc stream.mp4 played by the phone's NATIVE <video> element.
   * The native hardware decoder handles the H.265 feed directly (this is what
   * finally renders on the device). One continuous HTTP MP4 → no segment 404s,
   * no per-second reload. Auto-retries with backoff if the connection drops.
   *
   * The <video> stays `muted` so autoplay is always allowed (never blanks). The
   * speaker button calls window.__setMute(false) to turn sound on after a tap.
   */
  const liveHtml = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
video { width: 100%; height: 100%; object-fit: contain; background: #000; }
#status { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); color: #9ca3af; font-family: sans-serif; font-size: 13px; text-align: center; padding: 0 16px; }
</style>
</head>
<body>
<video id="video" autoplay muted playsinline></video>
<div id="status">Connecting to live stream...</div>
<script>
${ZOOM_PAN_JS}
(function(){
  var video = document.getElementById('video');
  var statusEl = document.getElementById('status');
  var streamUrl = ${JSON.stringify(liveMp4Url)};
  var retryCount = 0, maxRetries = 5, retryTimer = null;
  function post(t,e){ try { window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:t}, e||{}))); } catch(x){} }
  function setStatus(t){ if (t){ statusEl.style.display='block'; statusEl.innerHTML=t; } else { statusEl.style.display='none'; } }
  // AUDIO: RN calls this when the user taps the speaker button. The <video> starts
  // muted so autoplay always works; we only unmute after that explicit tap (a user
  // gesture) and (re)start playback so the browser lets the sound through.
  // Android WebView keeps its AudioContext suspended even when mediaPlaybackRequiresUserAction
  // is false — we must explicitly resume() it inside a real user-gesture call.
  window.__setMute = function(m){
    try {
      video.muted = !!m;
      if (!m){
        // Unlock the AudioContext so Android WebView actually outputs sound.
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (AC) { var ac = new AC(); if (ac.state === 'suspended') { ac.resume(); } }
        } catch(ae) {}
        // Re-call play() inside the same user-gesture microtask.
        var p = video.play();
        if (p && p.catch){ p.catch(function(e){ post('PLAY_ERROR_AUDIO', { message: String(e) }); }); }
      }
      post('MUTE', { muted: video.muted });
    } catch(e){}
  };
  function startStream(){
    post('MP4_CONNECT', { url: streamUrl, attempt: retryCount });
    setStatus('Connecting to live stream...');
    video.src = streamUrl; video.load();
  }
  video.addEventListener('loadedmetadata', function(){ post('LOADEDMETADATA', { w: video.videoWidth, h: video.videoHeight }); });
  video.addEventListener('canplay', function(){ setStatus(''); retryCount = 0; video.play().catch(function(e){ post('PLAY_ERROR',{message:String(e)}); }); });
  video.addEventListener('playing', function(){ setStatus(''); post('PLAYING'); });
  video.addEventListener('waiting', function(){ post('BUFFERING'); });
  video.addEventListener('stalled', function(){ post('STALLED'); });
  video.addEventListener('error', function(){
    var code = video.error ? video.error.code : 0;
    var msg = video.error ? video.error.message : '';
    post('VIDEO_ERROR', { code: code, message: msg, attempt: retryCount });
    if (retryCount < maxRetries){ retryCount++; var delay = Math.min(1000*retryCount,5000); setStatus('Stream interrupted. Reconnecting in '+Math.round(delay/1000)+'s...'); clearTimeout(retryTimer); retryTimer = setTimeout(startStream, delay); }
    else { setStatus('⚠ Could not connect to live stream. Tap Retry.'); post('GIVE_UP',{attempts:retryCount}); }
  });
  video.addEventListener('ended', function(){ post('STREAM_ENDED'); if (retryCount < maxRetries){ retryCount++; setStatus('Stream ended. Reconnecting...'); clearTimeout(retryTimer); retryTimer = setTimeout(startStream, 1000); } });
  setTimeout(function(){ var b=[]; try { for (var i=0;i<video.buffered.length;i++){ b.push([+video.buffered.start(i).toFixed(2), +video.buffered.end(i).toFixed(2)]); } } catch(e){} post('DIAG_4S', { videoReadyState: video.readyState, videoW: video.videoWidth, videoH: video.videoHeight, currentTime:+video.currentTime.toFixed(2), paused: video.paused, buffered:b, networkState: video.networkState, src: video.src ? 'set' : 'empty' }); }, 4000);
  startStream();
})();
</script>
</body>
</html>`,
    [liveMp4Url],
  );
  const liveSource = useMemo(
    () => ({ html: liveHtml, baseUrl: BASE_URL }),
    [liveHtml],
  );
  /*
   * MEMOIZED PLAYER ELEMENT
   * Same element reference across re-renders, so parent/state changes CANNOT
   * remount or reload the stream. Rebuilds only when method / retry / cookie /
   * URL actually change.
   */
  const streamPlayer = useMemo(() => {
    if (streamMethod === 'mjpeg') {
      return (
        <WebView
          key={`mjpeg-${streamKey}`}
          ref={webViewRef}
          onLoad={onWebViewLoad}
          source={mjpegSource}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          androidLayerType="hardware"
          overScrollMode="never"
          injectedJavaScriptBeforeContentLoaded={cookieInjection}
          onLoadStart={onLoadStart}
          onMessage={onStreamMessage}
          onError={onWebViewError}
          onHttpError={onWebViewHttpError}
        />
      );
    }
    if (streamMethod === 'live') {
      return (
        <WebView
          key={`live-${streamKey}`}
          ref={webViewRef}
          onLoad={onWebViewLoad}
          source={liveSource}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          androidLayerType="hardware"
          overScrollMode="never"
          injectedJavaScriptBeforeContentLoaded={cookieInjection}
          onLoadStart={onLoadStart}
          onMessage={onStreamMessage}
          onError={onWebViewError}
          onHttpError={onWebViewHttpError}
        />
      );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamMethod, streamKey, mjpegSource, liveSource, cookieInjection]);
  const renderError = (title: string, subtitle?: string) => (
    <View style={styles.errorContainer}>
      <Icon name="video-off-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>{title}</Text>
      {subtitle && <Text style={styles.errorSubtitle}>{subtitle}</Text>}
      <TouchableOpacity style={styles.retryBtn} onPress={retryStream}>
        <Icon name="refresh" size={16} color="#fff" />
        <Text style={styles.retryText}>Retry Stream</Text>
      </TouchableOpacity>
    </View>
  );
  const renderStream = () => {
    if (!cookieReady) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Preparing secure stream...</Text>
        </View>
      );
    }
    if (!sessionCookie) {
      return renderError('Session not found', 'Please logout and login again.');
    }
    if (streamMethod === 'rtsp') {
      return (
        <View style={styles.rtspContainer}>
          <Icon name="access-point-network" size={52} color="#f97316" />
          <Text style={styles.rtspTitle}>RTSP Stream</Text>
          <Text style={styles.rtspDesc}>
            This stream can be opened in VLC or another RTSP compatible player.
          </Text>
          <Text style={styles.rtspUrl} selectable>
            {rtspUrl}
          </Text>
        </View>
      );
    }
    return streamPlayer;
  };
  // The zoom / fullscreen controls only make sense over a real video/image player.
  const showingPlayer =
    isActive &&
    cookieReady &&
    !!sessionCookie &&
    (streamMethod === 'live' || streamMethod === 'mjpeg');
  const renderControls = (inFullscreen = false) => (
    <View style={styles.controlsOverlay} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.ctrlBtn, zoom <= 1 && styles.ctrlBtnDisabled]}
        onPress={zoomOut}
        disabled={zoom <= 1}
      >
        <Icon
          name="magnify-minus-outline"
          size={20}
          color={zoom <= 1 ? '#4b5563' : '#fff'}
        />
      </TouchableOpacity>
      <View style={styles.zoomBadge}>
        <Text style={styles.zoomBadgeText}>{zoom.toFixed(1)}x</Text>
      </View>
      <TouchableOpacity
        style={[styles.ctrlBtn, zoom >= 4 && styles.ctrlBtnDisabled]}
        onPress={zoomIn}
        disabled={zoom >= 4}
      >
        <Icon
          name="magnify-plus-outline"
          size={20}
          color={zoom >= 4 ? '#4b5563' : '#fff'}
        />
      </TouchableOpacity>
      {/* SPEAKER — turn audio on/off. Only on LIVE (MJPEG is a still image with no
          sound). Tap to unmute; the video was muted for reliable autoplay. */}
      {streamMethod === 'live' && (
        <TouchableOpacity style={styles.ctrlBtn} onPress={toggleMute}>
          <Icon
            name={muted ? 'volume-off' : 'volume-high'}
            size={20}
            color={muted ? '#fff' : '#22c55e'}
          />
        </TouchableOpacity>
      )}
      {/* ROTATE — fullscreen only. Turns the view to landscape without any native
          orientation library (RN transform on the container, not on the video). */}
      {inFullscreen && (
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => setFsRotated((r) => !r)}
        >
          <Icon
            name="screen-rotation"
            size={20}
            color={fsRotated ? '#3b82f6' : '#fff'}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.ctrlBtn}
        onPress={() => setIsFullscreen((f) => !f)}
      >
        <Icon
          name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color="#9ca3af"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle} numberOfLines={1}>
            {camera.camera_name}
          </Text>
          <Text style={styles.appbarSub}>{camera.camera_key}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isActive ? '#22c55e20' : '#ef444420' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isActive ? '#22c55e' : '#ef4444' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isActive ? '#22c55e' : '#ef4444' },
            ]}
          >
            {isActive ? 'Online' : 'Offline'}
          </Text>
        </View>
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isActive && (
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodBtn,
                streamMethod === 'live' && styles.methodBtnActive,
              ]}
              onPress={() => {
                if (streamMethod !== 'live') {
                  log('SWITCH METHOD → live (MP4)');
                  setStreamMethod('live');
                }
              }}
            >
              <Icon
                name="video-outline"
                size={14}
                color={streamMethod === 'live' ? '#fff' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.methodText,
                  streamMethod === 'live' && styles.methodTextActive,
                ]}
              >
                LIVE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodBtn,
                streamMethod === 'mjpeg' && styles.methodBtnActive,
              ]}
              onPress={() => {
                if (streamMethod !== 'mjpeg') {
                  log('SWITCH METHOD → mjpeg');
                  setStreamMethod('mjpeg');
                }
              }}
            >
              <Icon
                name="image-outline"
                size={14}
                color={streamMethod === 'mjpeg' ? '#fff' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.methodText,
                  streamMethod === 'mjpeg' && styles.methodTextActive,
                ]}
              >
                MJPEG
              </Text>
            </TouchableOpacity>

          </View>
        )}
        <View style={styles.thumbWrap}>
          {isActive ? (
            <View style={styles.streamContainer}>
              {!isFullscreen && renderStream()}
              {isFullscreen && showingPlayer && (
                <View style={styles.fsPlaceholder}>
                  <Icon name="fullscreen" size={28} color="#374151" />
                  <Text style={styles.fsPlaceholderText}>
                    Playing in full screen
                  </Text>
                </View>
              )}
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>
                  LIVE · {streamMethod.toUpperCase()}
                </Text>
              </View>
              {showingPlayer && !isFullscreen && renderControls(false)}
            </View>
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Icon name="cctv" size={64} color="#374151" />
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Camera Information</Text>
          <InfoRow icon="identifier" label="Camera ID" value={String(camera.id)} />
          <View style={styles.divider} />
          <InfoRow icon="key-variant" label="Camera Key" value={camera.camera_key} />
          <View style={styles.divider} />
          <InfoRow icon="map-marker-outline" label="Location" value={camera.location || 'Not specified'} />
          <View style={styles.divider} />
          <InfoRow icon="office-building-outline" label="Site Code" value={camera.site_code || 'N/A'} />
          <View style={styles.divider} />
          <InfoRow
            icon="circle-slice-8"
            label="Status"
            value={isActive ? 'Online / Active' : 'Offline / Inactive'}
            valueColor={isActive ? '#22c55e' : '#ef4444'}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="clock-outline"
            label="Last Heartbeat"
            value={formatHeartbeat(camera.last_heartbeat)}
          />
        </View>

      </ScrollView>
      {/* FULLSCREEN — the SAME player, moved into a full-screen Modal. The WebView
          remounts (stream reconnects in ~1s) and the current zoom + mute are
          re-applied on load. The rotate button turns the video to landscape by
          rotating this container (never the <video> element itself). */}
      <Modal
        visible={isFullscreen}
        onRequestClose={() => setIsFullscreen(false)}
        supportedOrientations={['portrait', 'landscape']}
        animationType="fade"
      >
        <View style={styles.fsContainer}>
          <View
            style={
              fsRotated
                ? {
                  position: 'absolute',
                  width: winH,
                  height: winW,
                  top: (winH - winW) / 2,
                  left: (winW - winH) / 2,
                  transform: [{ rotate: '90deg' }],
                }
                : styles.fsFill
            }
          >
            {isFullscreen && renderStream()}
          </View>
          {showingPlayer && renderControls(true)}
          <TouchableOpacity
            style={styles.fsCloseBtn}
            onPress={() => setIsFullscreen(false)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.fsLiveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              LIVE · {streamMethod.toUpperCase()}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  appbar: {
    backgroundColor: '#161b22',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  appbarTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  appbarSub: {
    color: '#6b7280',
    fontSize: 11,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  methodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#161b22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#21262d',
    padding: 4,
    gap: 4,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  methodBtnActive: {
    backgroundColor: '#3b82f6',
  },
  methodText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  thumbWrap: {
    margin: 16,
  },
  streamContainer: {
    height: 230,
    backgroundColor: '#000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262d',
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 10,
    fontSize: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  errorSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  thumbPlaceholder: {
    height: 230,
    backgroundColor: '#161b22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  offlineText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#161b22',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#21262d',
    padding: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#3b82f618',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#21262d',
    marginHorizontal: 14,
  },
  urlRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  urlLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  urlValue: {
    fontSize: 11,
    color: '#60a5fa',
    fontFamily: 'monospace',
  },
  rtspContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  rtspTitle: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  rtspDesc: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  rtspUrl: {
    color: '#60a5fa',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#1e3a8a30',
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  // ── Zoom + fullscreen controls ──────────────────────────────────────────────
  controlsOverlay: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  zoomBadge: {
    minWidth: 42,
    paddingHorizontal: 8,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  fsContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  fsFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fsCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsLiveTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fsPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  fsPlaceholderText: {
    color: '#4b5563',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});