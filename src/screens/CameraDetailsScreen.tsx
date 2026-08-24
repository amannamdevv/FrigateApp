import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { Appbar, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Camera } from '../api/frigateApi';

const SESSION_COOKIE_KEY = 'aivms_session_cookie';
const BASE_URL = 'https://aivms.shrotitele.com';
const HOST = 'aivms.shrotitele.com';

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

const InfoRow = ({ icon, label, value, valueColor }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Icon name={icon} size={18} color="#3b82f6" />
    </View>

    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text
        style={[
          styles.infoValue,
          valueColor ? { color: valueColor } : {},
        ]}
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

export const CameraDetailsScreen = ({
  route,
  navigation,
}: any) => {
  const { camera } = route.params as {
    camera: Camera;
  };

  // API kabhi 1, "1" ya true bhej sakti hai
  const isActive =
    camera.is_active === 1 ||
    camera.is_active === '1' ||
    camera.is_active === true;

  const [streamMethod, setStreamMethod] =
    useState<'mjpeg' | 'hls' | 'rtsp'>('mjpeg');

  const [cookieReady, setCookieReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [streamKey, setStreamKey] = useState(0);

  /*
   * STREAM IDENTIFIER
   * -----------------
   * This MUST match what the WORKING WEBSITE requests.
   * Open the website, DevTools → Network, watch the .m3u8 / mjpeg request,
   * and confirm the identifier in the URL. In most Frigate/go2rtc setups this
   * is the camera "key" (the config name), NOT the human display name.
   * If the website uses a different value, change ONLY this line.
   */
  const streamId = camera.camera_key;

  /*
   * STREAM URLS
   */
  // go2rtc HLS (fMP4)
  const nativeHlsUrl =
    `${BASE_URL}/api/go2rtc/api/stream.m3u8` +
    `?src=${encodeURIComponent(streamId)}` +
    `&mp4`;

  // Frigate MJPEG endpoint
  const mjpegUrl =
    `${BASE_URL}/api/${encodeURIComponent(streamId)}?fps=15`;

  const rtspUrl =
    `rtsp://aivms.shrotitele.com:8554/${streamId}`;

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
    log('HLS URL:', nativeHlsUrl);
    log('MJPEG URL:', mjpegUrl);
    log('RTSP URL:', rtspUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  /*
   * LOAD SESSION COOKIE → PUSH INTO NATIVE WEBVIEW JAR
   * --------------------------------------------------
   * This is the actual fix. The WebView uses the native Android cookie jar,
   * which is NOT the same store your axios/AsyncStorage cookie lives in.
   * We copy the session cookie into the native jar so the stream is authed.
   */
  useEffect(() => {
    let mounted = true;

    const setupCookies = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_COOKIE_KEY);
        log('SESSION COOKIE EXISTS IN STORAGE:', !!raw);

        if (!raw) {
          if (mounted) setHasSession(false);
          return;
        }

        const cookies = parseCookieString(raw);
        log(
          'COOKIE FORMAT (masked):',
          cookies.map((c) => `${c.name}=${maskValue(c.value)}`).join('; '),
        );

        for (const c of cookies) {
          await CookieManager.set(BASE_URL, {
            name: c.name,
            value: c.value,
            domain: HOST,
            path: '/',
            secure: true,
          });
        }

        try {
          await CookieManager.flush();
        } catch (_) {
          /* ignore */
        }

        // Verify what actually landed in the WebView jar (names only).
        try {
          const jar = await CookieManager.get(BASE_URL);
          log(
            'WEBVIEW JAR COOKIE NAMES:',
            Object.keys(jar || {}).join(', ') || '(empty)',
          );
        } catch (_) {
          /* ignore */
        }

        if (mounted) setHasSession(true);
      } catch (error) {
        log('COOKIE SETUP ERROR:', error);
        if (mounted) setHasSession(false);
      } finally {
        if (mounted) setCookieReady(true);
      }
    };

    setupCookies();

    return () => {
      mounted = false;
    };
  }, []);

  const retryStream = useCallback(() => {
    log('RETRY requested by user');
    setStreamKey((prev) => prev + 1);
  }, []);

  /*
   * WEBVIEW EVENT HANDLERS (shared by MJPEG + HLS)
   */
  const onStreamMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      log('WEBVIEW EVENT:', data);
    } catch {
      log('WEBVIEW EVENT (raw):', event?.nativeEvent?.data);
    }
  }, []);

  const onWebViewError = useCallback((event: any) => {
    const e = event?.nativeEvent || {};
    log('WEBVIEW ERROR:', {
      code: e.code,
      description: e.description,
      url: e.url,
    });
  }, []);

  const onWebViewHttpError = useCallback((event: any) => {
    const e = event?.nativeEvent || {};
    log('WEBVIEW HTTP ERROR:', {
      statusCode: e.statusCode,
      url: e.url,
      description: e.description,
    });
  }, []);

  /*
   * MJPEG HTML
   * ----------
   * Android WebView does NOT reliably render a raw multipart/x-mixed-replace
   * stream as the top-level document (often shows one frame or nothing) —
   * this is a common reason MJPEG "works on the website but not the app".
   * Rendering it inside an <img> tag is the reliable approach, and the request
   * is authenticated by the native cookie jar we populated above.
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
#status { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); color: #9ca3af; font-family: sans-serif; font-size: 13px; text-align: center; }
</style>
</head>
<body>
<div id="wrap"><img id="stream" /></div>
<div id="status">Connecting to camera...</div>
<script>
  function post(type, extra) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, extra || {}))); } catch (e) {}
  }
  var img = document.getElementById('stream');
  var statusEl = document.getElementById('status');
  img.onload = function () { statusEl.style.display = 'none'; post('MJPEG_FIRST_FRAME'); };
  img.onerror = function () { statusEl.innerHTML = '⚠ Unable to load stream (auth or camera issue)'; post('MJPEG_ERROR'); };
  post('MJPEG_START');
  img.src = ${JSON.stringify(mjpegUrl)};
</script>
</body>
</html>`,
    [mjpegUrl],
  );

  /*
   * HLS HTML (hls.js)
   * -----------------
   * xhrSetup sets withCredentials=true so the playlist AND every segment request
   * carry the session cookie. baseUrl is set to the stream origin so all requests
   * are same-origin (no CORS) and pick up cookies from the native jar.
   * hls.js version is PINNED (never use @latest in production).
   */
  const hlsHtml = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
video { width: 100%; height: 100%; object-fit: contain; background: #000; }
#status { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); color: #9ca3af; font-family: sans-serif; font-size: 13px; text-align: center; }
</style>
</head>
<body>
<video id="video" autoplay muted playsinline controls></video>
<div id="status">Connecting to live stream...</div>
<script>
  function post(type, extra) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, extra || {}))); } catch (e) {}
  }
  var video = document.getElementById('video');
  var statusEl = document.getElementById('status');
  var streamUrl = ${JSON.stringify(nativeHlsUrl)};

  function showError(m) { statusEl.style.display = 'block'; statusEl.innerHTML = '⚠ ' + m; }

  video.addEventListener('playing', function () { statusEl.style.display = 'none'; post('PLAYING'); });
  video.addEventListener('waiting', function () { post('BUFFERING'); });
  video.addEventListener('canplay', function () { post('CANPLAY'); });
  video.addEventListener('stalled', function () { post('STALLED'); });

  post('HLS_INIT', { url: streamUrl });

  if (window.Hls && Hls.isSupported()) {
    var hls = new Hls({
      lowLatencyMode: true,
      enableWorker: true,
      backBufferLength: 30,
      maxBufferLength: 12,
      maxMaxBufferLength: 30,
      liveSyncDurationCount: 3,
      manifestLoadingTimeOut: 12000,
      xhrSetup: function (xhr) { xhr.withCredentials = true; }
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      post('MANIFEST_PARSED');
      statusEl.style.display = 'none';
      video.play().catch(function (err) { post('PLAY_ERROR', { message: String(err) }); });
    });

    hls.on(Hls.Events.FRAG_BUFFERED, function () { post('FRAG_BUFFERED'); });

    hls.on(Hls.Events.ERROR, function (event, data) {
      post('HLS_ERROR', {
        fatal: data.fatal,
        errType: data.type,
        details: data.details,
        httpStatus: (data.response && data.response.code) || null
      });
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            post('HLS_RECOVER', { via: 'startLoad' });
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            post('HLS_RECOVER', { via: 'recoverMediaError' });
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            showError('Stream unavailable');
            break;
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = streamUrl;
    video.addEventListener('loadedmetadata', function () { statusEl.style.display = 'none'; post('NATIVE_HLS_META'); video.play(); });
    video.addEventListener('error', function () { showError('Unable to load stream'); post('NATIVE_HLS_ERROR'); });
  } else {
    showError('HLS is not supported');
    post('HLS_UNSUPPORTED');
  }
</script>
</body>
</html>`,
    [nativeHlsUrl],
  );

  /*
   * MEMOIZED SOURCES
   * ----------------
   * Recreating the source object on every render makes the WebView reload.
   * These are stable and only change when the URL actually changes, so the
   * player does NOT restart on unrelated state changes / parent re-renders.
   */
  const mjpegSource = useMemo(
    () => ({ html: mjpegHtml, baseUrl: BASE_URL }),
    [mjpegHtml],
  );
  const hlsSource = useMemo(
    () => ({ html: hlsHtml, baseUrl: BASE_URL }),
    [hlsHtml],
  );

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

  /*
   * MAIN STREAM RENDER
   */
  const renderStream = () => {
    // WAIT FOR COOKIE SETUP
    if (!cookieReady) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Preparing secure stream...</Text>
        </View>
      );
    }

    // NO SESSION
    if (!hasSession) {
      return renderError('Session not found', 'Please logout and login again.');
    }

    // RTSP (informational only — RN cannot play RTSP in a WebView)
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

    // MJPEG (rendered inside an <img>, authed via native cookie jar)
    if (streamMethod === 'mjpeg') {
      return (
        <WebView
          key={`mjpeg-${streamKey}`}
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
          onMessage={onStreamMessage}
          onError={onWebViewError}
          onHttpError={onWebViewHttpError}
        />
      );
    }

    // HLS (hls.js, withCredentials, authed via native cookie jar)
    return (
      <WebView
        key={`hls-${streamKey}`}
        source={hlsSource}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onMessage={onStreamMessage}
        onError={onWebViewError}
        onHttpError={onWebViewHttpError}
      />
    );
  };

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
            {
              backgroundColor: isActive ? '#22c55e20' : '#ef444420',
            },
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
        {/* STREAM TYPE */}
        {isActive && (
          <View style={styles.methodSelector}>
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

            <TouchableOpacity
              style={[
                styles.methodBtn,
                streamMethod === 'hls' && styles.methodBtnActive,
              ]}
              onPress={() => {
                if (streamMethod !== 'hls') {
                  log('SWITCH METHOD → hls');
                  setStreamMethod('hls');
                }
              }}
            >
              <Icon
                name="video-outline"
                size={14}
                color={streamMethod === 'hls' ? '#fff' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.methodText,
                  streamMethod === 'hls' && styles.methodTextActive,
                ]}
              >
                HLS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodBtn,
                streamMethod === 'rtsp' && styles.methodBtnActive,
              ]}
              onPress={() => {
                if (streamMethod !== 'rtsp') {
                  log('SWITCH METHOD → rtsp');
                  setStreamMethod('rtsp');
                }
              }}
            >
              <Icon
                name="access-point"
                size={14}
                color={streamMethod === 'rtsp' ? '#fff' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.methodText,
                  streamMethod === 'rtsp' && styles.methodTextActive,
                ]}
              >
                RTSP
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STREAM */}
        <View style={styles.thumbWrap}>
          {isActive ? (
            <View style={styles.streamContainer}>
              {renderStream()}

              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>
                  LIVE · {streamMethod.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Icon name="cctv" size={64} color="#374151" />
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          )}
        </View>

        {/* CAMERA INFORMATION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Camera Information</Text>

          <InfoRow
            icon="identifier"
            label="Camera ID"
            value={String(camera.id)}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="key-variant"
            label="Camera Key"
            value={camera.camera_key}
          />

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

        {/* STREAM URLs */}
        {isActive && (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Stream URLs</Text>

            <View style={styles.urlRow}>
              <Text style={styles.urlLabel}>HLS</Text>
              <Text style={styles.urlValue} selectable>
                {nativeHlsUrl}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.urlRow}>
              <Text style={styles.urlLabel}>MJPEG</Text>
              <Text style={styles.urlValue} selectable>
                {mjpegUrl}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
});
