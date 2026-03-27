import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/constants/theme';
// import messaging from '@react-native-firebase/messaging'; // TODO: Re-enable when Firebase is configured

// TODO: Re-enable when Firebase is configured
// messaging().setBackgroundMessageHandler(async (_remoteMessage) => {
//   // Background messages are handled natively; foreground handled in screens
// });

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.background}
            translucent={false}
          />
          <RootNavigator />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default App;
