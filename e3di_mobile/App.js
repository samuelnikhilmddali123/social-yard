import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, BackHandler, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle hardware Back button presses on Android TV remote
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [canGoBack]);

  const targetUrl = 'https://www.e3di.org/screen/ethree-pole2';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <StatusBar hidden={true} />
        
        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={{ uri: targetUrl }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            databaseEnabled={true}
            cacheEnabled={false}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="always"
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
            originWhitelist={['*']}
            allowsBackForwardNavigationGestures={true}
            pullToRefreshEnabled={false}
            overScrollMode="never"
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={true}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            onRenderProcessGone={() => {
              webViewRef.current?.reload();
            }}
            onError={(e) => {
              console.warn('WebView Error:', e.nativeEvent);
              setTimeout(() => {
                webViewRef.current?.reload();
              }, 3000);
            }}
            onHttpError={(e) => {
              console.warn('HTTP Error:', e.nativeEvent);
            }}
            style={styles.webview}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
