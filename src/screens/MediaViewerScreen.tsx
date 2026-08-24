import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_COOKIE_KEY_EXPORT } from '../api/client';

export const MediaViewerScreen = ({ route, navigation }: any) => {
  const { url, title = 'Media Viewer' } = route.params;
  const [cookie, setCookie] = useState<string | null>(null);
  const [cookieLoaded, setCookieLoaded] = useState(false);

  useEffect(() => {
    const loadCookie = async () => {
      try {
        const c = await AsyncStorage.getItem(SESSION_COOKIE_KEY_EXPORT);
        setCookie(c);
      } catch (e) {
        console.warn('Could not load cookie for media viewer');
      } finally {
        setCookieLoaded(true);
      }
    };
    loadCookie();
  }, []);

  const isVideo = url.toLowerCase().endsWith('.mp4');

  // We wrap the media in an HTML template so it scales perfectly and shows a proper video player
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5.0, user-scalable=yes">
        <style>
          body { margin: 0; background-color: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
          img, video { max-width: 100%; max-height: 100vh; object-fit: contain; }
        </style>
      </head>
      <body>
        ${isVideo 
          ? `<video src="${url}" controls autoplay playsinline preload="auto"></video>`
          : `<img src="${url}" />`
        }
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#e5e7eb" />
        <Appbar.Content title={title} titleStyle={styles.appbarTitle} />
      </Appbar.Header>
      <View style={styles.content}>
        {!cookieLoaded ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          /* Use WebView for both Video and Image to support pinch-to-zoom natively */
          <WebView
            source={{
              html: htmlContent,
              baseUrl: 'https://aivms.shrotitele.com',
            }}
            injectedJavaScriptBeforeContentLoaded={`document.cookie = '${cookie}'; true;`}
            sharedCookiesEnabled={true}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading Media...</Text>
              </View>
            )}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            scalesPageToFit={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  appbar: { backgroundColor: '#161b22', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  appbarTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  content: { flex: 1, backgroundColor: '#000000' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loader: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 12,
    fontSize: 14,
  },
});
