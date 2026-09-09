import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.bg,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sequence/index"
          options={{
            title: 'Sequence',
          }}
        />
        <Stack.Screen
          name="n-back/index"
          options={{
            title: 'N-back',
          }}
        />
        <Stack.Screen
          name="grid/index"
          options={{
            title: 'Spatial Grid',
          }}
        />
        <Stack.Screen
          name="even-factors/index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
