---
title: Audio (expo-audio)
description: A library that provides an API to implement audio playback and recording in apps.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-audio'
packageName: 'expo-audio'
iconUrl: '/static/images/packages/expo-av.png'
platforms: ['android', 'ios', 'web', 'tvos', 'expo-go']
---

# Expo Audio (expo-audio)

A library that provides an API to implement audio playback and recording in apps.
Android, iOS, tvOS, Web, Included in Expo Go

`expo-audio` is a cross-platform audio library for accessing the native audio capabilities of the device.

The [Android media format support documentation](https://developer.android.com/media/media3/exoplayer/supported-formats) covers formats supported when using Expo Player on Android. The [iOS audio and video format documentation](https://developer.apple.com/documentation/coreaudiotypes/audio-format-identifiers) lists supported media formats for Apple devices.

Note that audio automatically stops if headphones/Bluetooth audio devices are disconnected.

## Installation

```sh
npx expo install expo-audio
```

If you are installing this in an [existing React Native app](/bare/overview), make sure to [install `expo`](/bare/installing-expo-modules) in your project.

## Configuration in app config

You can configure `expo-audio` using its built-in [config plugin](/config-plugins/introduction) if you use config plugins in your project ([Continuous Native Generation (CNG)](/workflow/continuous-native-generation)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect. If your app does **not** use CNG, then you'll need to manually configure the library.

### Example app.json with config plugin

```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone.",
          "enableBackgroundPlayback": true,
          "enableBackgroundRecording": false
        }
      ]
    ]
  }
}
```

### Configurable properties

| Name | Default | Description |
| --- | --- | --- |
| `microphonePermission` | `"Allow $(PRODUCT_NAME) to access your microphone"` | Only for: iOS. A string to set the `NSMicrophoneUsageDescription` permission message. Setting it to `false` will disable the permission. |
| `recordAudioAndroid` | `true` | Only for: Android. A boolean that determines whether to enable the `RECORD_AUDIO` permission on Android. |
| `enableBackgroundRecording` | `false` | A boolean that determines whether to enable background audio recording. On Android, this adds a recording foreground service and permissions and displays a persistent notification during recording. On iOS, this adds the `audio` background mode. **Note:** Background recording can significantly impact battery life. |
| `enableBackgroundPlayback` | `true` | A boolean that determines whether to enable background audio playback. On Android, this adds a media playback foreground service and allows you to display the lockscreen controls and is required for sustained background playback. On iOS, this adds the `audio` background mode. |

## Usage

### Playing sounds

```jsx
import { View, StyleSheet, Button } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

const audioSource = require('./assets/Hello.mp3');

export default function App() {
  const player = useAudioPlayer(audioSource);

  return (
    <View style={styles.container}>
      <Button title="Play Sound" onPress={() => player.play()} />
      <Button
        title="Replay Sound"
        onPress={() => {
          player.seekTo(0);
          player.play();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
```

### Recording sounds

```jsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';

export default function App() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const record = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={recorderState.isRecording ? stopRecording : record}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
```

### Playing audio in the background

Background audio playback allows your app to continue playing audio when it moves to the background or when the device screen locks.

#### Configuration

To enable background audio playback, use the config plugin in your [app config](/workflow/configuration):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "enableBackgroundPlayback": true
        }
      ]
    ]
  }
}
```

The above configuration automatically configures the required native settings:

-   Android Adds `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permissions. Also declares a media playback foreground service (`AudioControlsService`) in app's **AndroidManifest.xml**.
-   iOS Adds the `audio` `UIBackgroundMode` capability

#### Usage

After configuring your app with the config plugin, you need to:

1.  **Configure the audio session** to allow background playback
2.  **Enable lock screen controls** (required on Android for sustained background playback)

```jsx
import { View, Button } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';

export default function AudioPlayerScreen() {
  const audioSource = require('./assets/audio.mp3');
  const player = useAudioPlayer(audioSource);

  useEffect(() => {
    // Configure audio session for background playback
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  const handlePlay = () => {
    // Enable lock screen controls with metadata
    player.setActiveForLockScreen(true, {
      title: 'My Audio Title',
      artist: 'Artist Name',
      albumTitle: 'Album Name',
      artworkUrl: 'https://example.com/artwork.jpg', // optional
    });

    // Start playback - this will continue in the background
    player.play();
  };

  const handleStop = () => {
    player.pause();
    // Optionally disable lock screen controls when done
    player.setActiveForLockScreen(false);
  };

  return (
    <View>
      <Button title="Play" onPress={handlePlay} />
      <Button title="Stop" onPress={handleStop} />
    </View>
  );
}
```
Android

> **Note**: On Android, you have to enable the lock screen controls with [`setActiveForLockScreen`](/versions/latest/sdk/audio#setactiveforlockscreenactive-metadata-options) for sustained background playback. Otherwise, the audio will stop after approximately 3 minutes of background playback (OS limitation). Ensure to appropriately [configure the config plugin](/versions/latest/sdk/audio#configuration-in-app-config).

-   A media notification appears in the notification drawer with playback controls
-   Audio continues playing indefinitely in the background
-   Users can control playback from the lock screen and notification
-   The foreground service keeps the playback alive during playback
iOS

On iOS, audio playback continues seamlessly in the background once the audio session is configured with `shouldPlayInBackground: true`. Lock screen controls are optional but enhance the user experience by providing playback controls on the lock screen and Control Center.

Are you using this library in an existing React Native app?

If you're not using Continuous Native Generation ([CNG](/workflow/continuous-native-generation)) (you're using native **android** and **ios** projects manually), then you need to configure the following for background playback:

-   For Android, add to **android/app/src/main/AndroidManifest.xml**:
    
    ```xml
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    
    <application>
      <!-- Other application components -->
      <service
        android:name="expo.modules.audio.service.AudioControlsService"
        android:exported="false"
        android:foregroundServiceType="mediaPlayback">
        <intent-filter>
          <action android:name="androidx.media3.session.MediaSessionService" />
        </intent-filter>
      </service>
    </application>
    ```
    
-   For iOS, add to **ios/YourApp/Info.plist**:
    
    ```xml
    <key>UIBackgroundModes</key>
    <array>
      <string>audio</string>
    </array>
    ```

### Recording audio in the background

> Background recording can significantly impact battery life. Only enable it when necessary for your app's functionality.

Background audio recording allows your app to continue recording when it moves to the background or when the device screen locks.

To enable background recording, use the config plugin in your [app config](/workflow/configuration):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to record audio.",
          "enableBackgroundRecording": true
        }
      ]
    ]
  }
}
```

The above configuration automatically configures the required native settings:

-   Android Adds `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, and `POST_NOTIFICATIONS` permissions. Also declares an audio recording foreground service in app's **AndroidManifest.xml**.
-   iOS Adds the `audio` `UIBackgroundMode` capability

Are you using this library in an existing React Native app?

If you're not using Continuous Native Generation ([CNG](/workflow/continuous-native-generation)) (you're using native **android** and **ios** projects manually), then you need to configure the following permissions in your native projects:

-   For Android, add to **android/app/src/main/AndroidManifest.xml**:
    
    ```xml
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    ```
    
-   For iOS, add to **ios/YourApp/Info.plist**:
    
    ```xml
    <key>UIBackgroundModes</key>
    <array>
      <string>audio</string>
    </array>
    ```

#### Usage

After configuring your app, enable background recording at runtime using [`setAudioModeAsync`](/versions/latest/sdk/audio#audiosetaudiomodeasyncmode):

```jsx
import { setAudioModeAsync, useAudioRecorder, RecordingPresets } from 'expo-audio';

await setAudioModeAsync({
  playsInSilentMode: true,
  allowsRecording: true,
  allowsBackgroundRecording: true,
});

const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
await recorder.prepareToRecordAsync();
await recorder.record();

// Recording continues in background
```
Android

On Android, background recording requires a foreground service, which displays a persistent notification with the text "Recording audio" and a stop button. This notification cannot be dismissed while recording is active and automatically disappears when recording stops.
iOS

On iOS, background recording continues seamlessly when the app is in the background or the screen locks. No additional notifications or indicators are shown to the app user beyond the system status bar.

### Using the AudioPlayer directly

In most cases, use the [`useAudioPlayer`](/versions/latest/sdk/audio#useaudioplayersource-options) hook to create an `AudioPlayer` instance. It manages the player's lifecycle and ensures proper disposal when the component unmounts. However, in some advanced use cases, you may need to create an `AudioPlayer` that persists beyond the component's lifecycle. In those cases, use the [`createAudioPlayer`](/versions/latest/sdk/audio#audiocreateaudioplayersource-options) function. You need to be aware of the risks that come with this approach, as it is your responsibility to call the [`release()`](/versions/latest/sdk/expo#release) method when the player is no longer needed. If not handled properly, this approach may lead to memory leaks.

```tsx
import { createAudioPlayer } from 'expo-audio';
const player = createAudioPlayer(audioSource);
```

### Notes on web usage

-   A MediaRecorder issue on Chrome produces WebM files missing the duration metadata. [See the open Chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=642012).
-   MediaRecorder encoding options and other configurations are inconsistent across browsers. Using a polyfill such as [kbumsik/opus-media-recorder](https://github.com/kbumsik/opus-media-recorder) or [ai/audio-recorder-polyfill](https://github.com/ai/audio-recorder-polyfill) in your application will improve your experience. Any options passed to `prepareToRecordAsync` will be passed directly to the MediaRecorder API and as such the polyfill.
-   Web browsers require sites to be served securely for them to listen to a mic. See [MediaDevices `getUserMedia()` security](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security) for more details.

## API

```js
import { useAudioPlayer, useAudioRecorder } from 'expo-audio';
```

## Constants

### `Audio.RecordingPresets`

Supported platforms: Android, iOS, tvOS, Web.

Type: { HIGH_QUALITY: [RecordingOptions](#recordingoptions), LOW_QUALITY: [RecordingOptions](#recordingoptions) }

Constant which contains definitions of the two preset examples of `RecordingOptions`, as implemented in the Audio SDK.

#### `HIGH_QUALITY`

```ts
RecordingPresets.HIGH_QUALITY = {
 extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};
```

#### `LOW_QUALITY`

```ts
RecordingPresets.LOW_QUALITY = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 64000,
  android: {
    extension: '.3gp',
    outputFormat: '3gp',
    audioEncoder: 'amr_nb',
  },
  ios: {
    audioQuality: AudioQuality.MIN,
    outputFormat: IOSOutputFormat.MPEG4AAC,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};
```

## Hooks

### `useAudioPlayer(source, options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `source`(optional) | [AudioSource](#audiosource) | The audio source to load. Can be a local asset via `require()`, a remote URL, or null for no initial source. Default: `null` |
| `options`(optional) | [AudioPlayerOptions](#audioplayeroptions) | Audio player configuration options. Default: `{}` |

  

Creates an `AudioPlayer` instance that automatically releases when the component unmounts.

This hook manages the player's lifecycle and ensures it's properly disposed when no longer needed. The player will start loading the audio source immediately upon creation.

Returns: `AudioPlayer`

An `AudioPlayer` instance that's automatically managed by the component lifecycle.

Example

```tsx
import { useAudioPlayer } from 'expo-audio';

function MyComponent() {
  const player = useAudioPlayer(require('./sound.mp3'));

  return (
    <Button title="Play" onPress={() => player.play()} />
  );
}
```

Example

```tsx
import { useAudioPlayer } from 'expo-audio';

function MyComponent() {
  const player = useAudioPlayer('https://example.com/audio.mp3', {
    updateInterval: 1000,
    downloadFirst: true,
  });

  return (
    <Button title="Play" onPress={() => player.play()} />
  );
}
```

### `useAudioPlayerStatus(player)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `player` | [AudioPlayer](#audioplayer) | The `AudioPlayer` instance to monitor. |

  

Hook that provides real-time playback status updates for an `AudioPlayer`.

This hook automatically subscribes to playback status changes and returns the current status. The status includes information about playback state, current time, duration, loading state, and more.

Returns: `AudioStatus`

The current `AudioStatus` object containing playback information.

Example

```tsx
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

function PlayerComponent() {
  const player = useAudioPlayer(require('./sound.mp3'));
  const status = useAudioPlayerStatus(player);

  return (
    <View>
      <Text>Playing: {status.playing ? 'Yes' : 'No'}</Text>
      <Text>Current Time: {status.currentTime}s</Text>
      <Text>Duration: {status.duration}s</Text>
    </View>
  );
}
```

### `useAudioPlaylist(options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [AudioPlaylistOptions](#audioplaylistoptions) | Audio playlist configuration options including initial sources and loop mode. Default: `{}` |

  

Creates an `AudioPlaylist` instance that automatically releases when the component unmounts.

This hook manages the playlist's lifecycle and ensures it's properly disposed when no longer needed. An audio playlist allows you to manage a collection of audio sources with gapless playback support.

Returns: `AudioPlaylist`

An `AudioPlaylist` instance that's automatically managed by the component lifecycle.

Example

```tsx
import { useAudioPlaylist } from 'expo-audio';

function PlaylistPlayer() {
  const playlist = useAudioPlaylist({
    sources: [
      require('./track1.mp3'),
      require('./track2.mp3'),
      'https://example.com/track3.mp3',
    ],
    loop: 'all',
  });

  return (
    <View>
      <Text>Track {playlist.currentIndex + 1} of {playlist.trackCount}</Text>
      <Button title="Previous" onPress={() => playlist.previous()} />
      <Button title={playlist.playing ? 'Pause' : 'Play'} onPress={() => playlist.playing ? playlist.pause() : playlist.play()} />
      <Button title="Next" onPress={() => playlist.next()} />
    </View>
  );
}
```

### `useAudioPlaylistStatus(playlist)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `playlist` | [AudioPlaylist](#audioplaylist) | The `AudioPlaylist` instance to monitor. |

  

Hook that provides real-time status updates for an `AudioPlaylist`.

This hook automatically subscribes to playlist status changes and returns the current status. The status includes information about the current track, playback state, and playlist position.

Returns: `AudioPlaylistStatus`

The current `AudioPlaylistStatus` object containing playlist and playback information.

Example

```tsx
import { useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';

function PlaylistStatusDisplay() {
  const playlist = useAudioPlaylist({ sources: [require('./track1.mp3')] });
  const status = useAudioPlaylistStatus(playlist);

  return (
    <View>
      <Text>Track: {status.currentIndex + 1} / {status.trackCount}</Text>
      <Text>Time: {status.currentTime}s / {status.duration}s</Text>
      <Text>Playing: {status.playing ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

### `useAudioRecorder(options, statusListener)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | [RecordingOptions](#recordingoptions) | Recording configuration options including format, quality, sample rate, etc. |
| `statusListener`(optional) | (status: [RecordingStatus](#recordingstatus)) => void | Optional callback function that receives recording status updates. |

  

Hook that creates an `AudioRecorder` instance for recording audio.

This hook manages the recorder's lifecycle and ensures it's properly disposed when no longer needed. The recorder is automatically prepared with the provided options and can be used to record audio.

Returns: `AudioRecorder`

An `AudioRecorder` instance that's automatically managed by the component lifecycle.

Example

```tsx
import { useAudioRecorder, RecordingPresets } from 'expo-audio';

function RecorderComponent() {
  const recorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY,
    (status) => console.log('Recording status:', status)
  );

  const startRecording = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  return (
    <Button title="Start Recording" onPress={startRecording} />
  );
}
```

### `useAudioRecorderState(recorder, interval)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `recorder` | [AudioRecorder](#audiorecorder) | The `AudioRecorder` instance to monitor. |
| `interval`(optional) | `number` | How often (in milliseconds) to poll the recorder's status. Defaults to 500ms. Default: `500` |

  

Hook that provides real-time recording state updates for an `AudioRecorder`.

This hook polls the recorder's status at regular intervals and returns the current recording state. Use this when you need to monitor the recording status without setting up a status listener.

Returns: `RecorderState`

The current `RecorderState` containing recording information.

Example

```tsx
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';

function RecorderStatusComponent() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  return (
    <View>
      <Text>Recording: {state.isRecording ? 'Yes' : 'No'}</Text>
      <Text>Duration: {Math.round(state.durationMillis / 1000)}s</Text>
      <Text>Can Record: {state.canRecord ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

### `useAudioSampleListener(player, listener)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `player` | [AudioPlayer](#audioplayer) | The `AudioPlayer` instance to sample audio from. |
| `listener` | (data: [AudioSample](#audiosample)) => void | Function called with each audio sample containing waveform data. |

  

Hook that sets up audio sampling for an `AudioPlayer` and calls a listener with audio data.

This hook enables audio sampling on the player (if supported) and subscribes to audio sample updates. Audio sampling provides real-time access to audio waveform data for visualization or analysis.

> **Note:** Audio sampling requires `RECORD_AUDIO` permission on Android and is not supported on all platforms.

Returns: `void`

Example

```tsx
import { useEffect } from 'react';
import { useAudioPlayer, useAudioSampleListener, requestRecordingPermissionsAsync } from 'expo-audio';

function AudioVisualizerComponent() {
  const player = useAudioPlayer(require('./music.mp3'));

  // if required on Android, request recording permissions
  useEffect(() => {
    async function requestPermission() {
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        console.log("Permission granted");
      }
    }

    requestPermission();
   }, []);

  useAudioSampleListener(player, (sample) => {
    // Use sample.channels array for audio visualization
    console.log('Audio sample:', sample.channels[0].frames);
  });

  return <AudioWaveform player={player} />;
}
```

## Classes

### `AudioPlayer`

Supported platforms: Android, iOS, tvOS, Web.

Type: Class extends [SharedObject](/versions/v55.0.0/sdk/expo#sharedobjecttype)<[AudioEvents](#audioevents)\>

AudioPlayer Properties

### `currentTime`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

The current position through the audio item in seconds.

### `duration`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

The total duration of the audio in seconds.

### `id`

Supported platforms: Android, iOS, tvOS, Web.

Type: `string`

Unique identifier for the player object.

### `isAudioSamplingSupported`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether audio sampling is supported on the platform.

### `isBuffering`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the player is buffering.

### `isLoaded`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the player is finished loading.

### `loop`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the player is currently looping.

### `muted`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the player is currently muted.

### `paused`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the player is currently paused.

### `playbackRate`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

The current playback rate of the audio. It accepts different values depending on the platform:

-   **Android**: `0.1` to `2.0`
-   **iOS**: `0.0` to `2.0`
-   **Web**: Follows browser implementation

Example

```tsx
import { useAudioPlayer } from 'expo-audio';

export default function App() {
  const player = useAudioPlayer(source);

  // Normal playback speed
  player.playbackRate = 1.0;

  // Slow motion (half speed)
  player.playbackRate = 0.5;

  // Fast playback (1.5x speed)
  player.playbackRate = 1.5;

  // Maximum speed on mobile
  player.playbackRate = 2.0;
}
```

### `playing`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the player is currently playing.

### `shouldCorrectPitch`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

A boolean describing if we are correcting the pitch for a changed rate.

### `volume`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

The current volume of the audio.

**Range:** `0.0` to `1.0`. For example, `0.0` is completely silent (0%), `0.5` is half volume (50%), and `1.0` is full volume (100%).

Example

```tsx
import { useAudioPlayer } from 'expo-audio';

export default function App() {
  const player = useAudioPlayer(source);

  // Mute the audio
  player.volume = 0.0;

  // Set volume to 50%
  player.volume = 0.5;

  // Set to full volume
  player.volume = 1.0;
}
```

AudioPlayer Methods

### `clearLockScreenControls()`

Supported platforms: Android, iOS, tvOS, Web.

Removes this player from lock screen controls if it's currently active. This will clear the lock screen's now playing info.

Returns: `void`

### `pause()`

Supported platforms: Android, iOS, tvOS, Web.

Pauses the player.

Returns: `void`

### `play()`

Supported platforms: Android, iOS, tvOS, Web.

Start playing audio.

Returns: `void`

### `remove()`

Supported platforms: Android, iOS, tvOS, Web.

Remove the player from memory to free up resources.

Returns: `void`

### `replace(source)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type |
| --- | --- |
| `source` | [AudioSource](#audiosource) |

  

Replaces the current audio source with a new one.

Returns: `void`

### `seekTo(seconds, toleranceMillisBefore, toleranceMillisAfter)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `seconds` | `number` | The number of seconds to seek by. |
| `toleranceMillisBefore`(optional) | `number` | The tolerance allowed before the requested seek time, in milliseconds. iOS only. |
| `toleranceMillisAfter`(optional) | `number` | The tolerance allowed after the requested seek time, in milliseconds. iOS only. |

  

Seeks the playback by the given number of seconds.

Returns: `Promise<void>`

### `setActiveForLockScreen(active, metadata, options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Whether this player should be active for lock screen controls. |
| `metadata`(optional) | [AudioMetadata](#audiometadata) | Optional metadata to display on the lock screen (title, artist, album, artwork). |
| `options`(optional) | [AudioLockScreenOptions](#audiolockscreenoptions) | Optional configuration to configure the lock screen controls. |

  

Sets or removes this audio player as the active player for lock screen controls. Only one player can control the lock screen at a time.

> **Note:** For lock screen controls to work correctly, [`interruptionMode`](#interruptionmode) must be set to `doNotMix` using [`setAudioModeAsync`](#audiosetaudiomodeasyncmode). Without this, the OS might not associate lock screen controls with your player.

Returns: `void`

### `setPlaybackRate(rate, pitchCorrectionQuality)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `rate` | `number` | The playback rate of the audio. See [`playbackRate`](#playbackrate) property for detailed range information. |
| `pitchCorrectionQuality`(optional) | [PitchCorrectionQuality](#pitchcorrectionquality) | The quality of the pitch correction. |

  

Sets the current playback rate of the audio.

Returns: `void`

### `updateLockScreenMetadata(metadata)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `metadata` | [AudioMetadata](#audiometadata) | The metadata to display (title, artist, album, artwork). |

  

Updates the metadata displayed on the lock screen for this player. This method only has an effect if this player is currently active for lock screen controls.

Returns: `void`

### `AudioPlaylist`

Supported platforms: Android, iOS, tvOS, Web.

Type: Class extends [SharedObject](/versions/v55.0.0/sdk/expo#sharedobjecttype)<[AudioPlaylistEvents](#audioplaylistevents)\>

AudioPlaylist Properties

### `currentIndex`

Supported platforms: Android, iOS, tvOS, Web.

Read Only • Type: `number`

Index of the currently playing track in the playlist.

### `currentTime`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

Current playback position in seconds.

### `duration`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

Duration of the current track in seconds.

### `id`

Supported platforms: Android, iOS, tvOS, Web.

Type: `string`

Unique identifier for the playlist instance.

### `isBuffering`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the playlist is buffering.

### `isLoaded`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the current track has finished loading.

### `loop`

Supported platforms: Android, iOS, tvOS, Web.

Type: [AudioPlaylistLoopMode](#audioplaylistloopmode)

Current loop mode.

### `muted`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the playlist is currently muted.

### `playbackRate`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

Current playback rate (1.0 = normal speed).

### `playing`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the playlist is currently playing.

### `sources`

Supported platforms: Android, iOS, tvOS, Web.

Read Only • Type: [AudioSourceInfo[]](#audiosourceinfo)

The audio sources currently in the playlist.

### `trackCount`

Supported platforms: Android, iOS, tvOS, Web.

Read Only • Type: `number`

Total number of tracks in the playlist.

### `volume`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

Current volume (0.0 to 1.0).

AudioPlaylist Methods

### `add(source)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `source` | [AudioSource](#audiosource) | The audio source to add. |

  

Add a track to the end of the playlist.

Returns: `void`

### `clear()`

Supported platforms: Android, iOS, tvOS, Web.

Clear all tracks from the playlist.

Returns: `void`

### `destroy()`

Supported platforms: Android, iOS, tvOS, Web.

Destroy the playlist and free up resources.

Returns: `void`

### `insert(source, index)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `source` | [AudioSource](#audiosource) | The audio source to insert. |
| `index` | `number` | The position to insert at. |

  

Insert a track at a specific position in the playlist.

Returns: `void`

### `next()`

Supported platforms: Android, iOS, tvOS, Web.

Skip to the next track in the playlist. If at the end of the playlist and loop mode is 'all', wraps to the first track. If loop mode is 'none' and at the end, does nothing.

Returns: `void`

### `pause()`

Supported platforms: Android, iOS, tvOS, Web.

Pause playback.

Returns: `void`

### `play()`

Supported platforms: Android, iOS, tvOS, Web.

Start playing the current track in the playlist.

Returns: `void`

### `previous()`

Supported platforms: Android, iOS, tvOS, Web.

Skip to the previous track in the playlist. If at the beginning of the playlist and loop mode is 'all', wraps to the last track. If loop mode is 'none' and at the beginning, does nothing.

Returns: `void`

### `remove(index)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `index` | `number` | The index of the track to remove. |

  

Remove a track from the playlist by index.

Returns: `void`

### `seekTo(seconds)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `seconds` | `number` | The position to seek to. |

  

Seeks the playback to a specific position in seconds.

Returns: `Promise<void>`

### `skipTo(index)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `index` | `number` | The index of the track to skip to. |

  

Skip to a specific track in the playlist by index.

Returns: `void`

### `AudioRecorder`

Supported platforms: Android, iOS, tvOS, Web.

Type: Class extends [SharedObject](/versions/v55.0.0/sdk/expo#sharedobjecttype)<[RecordingEvents](#recordingevents)\>

AudioRecorder Properties

### `currentTime`

Supported platforms: Android, iOS, tvOS, Web.

Type: `number`

The current length of the recording, in seconds.

### `id`

Supported platforms: Android, iOS, tvOS, Web.

Type: `string`

Unique identifier for the recorder object.

### `isRecording`

Supported platforms: Android, iOS, tvOS, Web.

Type: `boolean`

Boolean value indicating whether the recording is in progress.

### `uri`

Supported platforms: Android, iOS, tvOS, Web.

Literal type: `union`

The uri of the recording.

Acceptable values are: `string` | `null`

AudioRecorder Methods

### `getAvailableInputs()`

Supported platforms: Android, iOS, tvOS, Web.

Returns a list of available recording inputs. This method can only be called if the `Recording` has been prepared.

Returns: `RecordingInput[]`

A `Promise` that is fulfilled with an array of `RecordingInput` objects.

### `getCurrentInput()`

Supported platforms: Android, iOS, tvOS, Web.

Returns the currently-selected recording input. This method can only be called if the `Recording` has been prepared.

Returns: `Promise<recordinginput>`

A `Promise` that is fulfilled with a `RecordingInput` object.

### `getStatus()`

Supported platforms: Android, iOS, tvOS, Web.

Status of the current recording.

Returns: `RecorderState`

### `pause()`

Supported platforms: Android, iOS, tvOS, Web.

Pause the recording.

Returns: `void`

### `prepareToRecordAsync(options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type |
| --- | --- |
| `options`(optional) | [Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<[RecordingOptions](#recordingoptions)\> |

  

Prepares the recording for recording.

Returns: `Promise<void>`

### `record(options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [RecordingStartOptions](#recordingstartoptions) | Optional recording configuration options. |

  

Starts the recording.

Returns: `void`

> **Deprecated:** Use `record({ forDuration: seconds })` instead.

### `recordForDuration(seconds)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `seconds` | `number` | The time in seconds to stop recording at. |

  

Stops the recording once the specified time has elapsed.

Returns: `void`

### `setInput(inputUid)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `inputUid` | `string` | The uid of a `RecordingInput`. |

  

Sets the current recording input.

Returns: `void`

A `Promise` that is resolved if successful or rejected if not.

> **Deprecated:** Use `record({ atTime: seconds })` instead.

### `startRecordingAtTime(seconds)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `seconds` | `number` | The time in seconds to start recording at. |

  

Starts the recording at the given time.

Returns: `void`

### `stop()`

Supported platforms: Android, iOS, tvOS, Web.

Stop the recording.

Returns: `Promise<void>`

## Methods

### `Audio.clearAllPreloadedSources()`

Supported platforms: Android, iOS, tvOS, Web.

Releases all preloaded audio sources to free memory.

Returns: `Promise<void>`

### `Audio.clearPreloadedSource(source)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `source` | [AudioSource](#audiosource) | The audio source to release. Must match the source previously passed to `preload()`. |

  

Releases a specific preloaded audio source to free memory.

Returns: `Promise<void>`

### `Audio.createAudioPlayer(source, options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `source`(optional) | [AudioSource](#audiosource) | The audio source to load. Default: `null` |
| `options`(optional) | [AudioPlayerOptions](#audioplayeroptions) | Audio player configuration options. Default: `{}` |

  

Creates an instance of an `AudioPlayer` that doesn't release automatically.

> For most use cases you should use the [`useAudioPlayer`](#useaudioplayersource-options) hook instead. See the [Using the `AudioPlayer` directly](#using-the-audioplayer-directly) section for more details.

Returns: `AudioPlayer`

### `Audio.createAudioPlaylist(options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `options`(optional) | [AudioPlaylistOptions](#audioplaylistoptions) | Audio playlist configuration options. Default: `{}` |

  

Creates an instance of an `AudioPlaylist` that doesn't release automatically.

> For most use cases you should use the [`useAudioPlaylist`](#useaudioplaylistoptions) hook instead.

Returns: `AudioPlaylist`

### `Audio.getPreloadedSources()`

Supported platforms: Android, iOS, tvOS, Web.

Returns the URIs of all currently preloaded audio sources.

On iOS, sources are removed from this list when consumed by `useAudioPlayer()`, `createAudioPlayer()`, or `player.replace()`. On Android and web, sources remain until explicitly cleared with `clearPreloadedSource()` / `clearAllPreloadedSources()`.

Returns: `Promise<string[]>`

An array of URI strings for sources currently in the preload cache.

### `Audio.getRecordingPermissionsAsync()`

Supported platforms: Android, iOS, tvOS, Web.

Checks the current status of recording permissions without requesting them.

This function returns the current permission status for microphone access without triggering a permission request dialog. Use this to check permissions before deciding whether to call `requestRecordingPermissionsAsync()`.

Returns: `Promise<permissionresponse>`

A Promise that resolves to a `PermissionResponse` object containing the current permission status.

Example

```tsx
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

const ensureRecordingPermissions = async () => {
  const { status } = await getRecordingPermissionsAsync();

  if (status !== 'granted') {
    // Permission not granted, request it
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  }

  return true; // Already granted
};
```

### `Audio.preload(source, options)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `source` | [AudioSource](#audiosource) | The audio source to preload. Can be a URL string, a local asset via `require()`, or an audio source object. |
| `options`(optional) | [PreloadOptions](#preloadoptions) | Optional configuration for preloading behavior. Default: `{}` |

  

Preloads an audio source for near-instant playback later.

This should be called in module scope, before any React components render. When the source is later used with `useAudioPlayer()`, `createAudioPlayer()`, or `player.replace()`, playback begins with minimal delay.

Returns: `Promise<void>`

Example

```tsx
import { preload, useAudioPlayer } from 'expo-audio';

const track1 = 'https://example.com/track1.mp3';
const track2 = 'https://example.com/track2.mp3';

// Preload at module scope — starts buffering immediately
preload(track1);
preload(track2, { preferredForwardBufferDuration: 20 });

export default function App() {
  const player = useAudioPlayer(track1);
  // Playback starts near-instantly because the source was preloaded
  return <Button title="Play" onPress={() => player.play()} />;
}
```

### `Audio.requestNotificationPermissionsAsync()`

Supported platforms: Android, iOS, tvOS, Web.

Requests permission to record audio from the microphone.

This function prompts the user for microphone access permission, which is required for audio recording functionality. On iOS, this will show the system permission dialog. On Android, this requests the `RECORD_AUDIO` permission.

Returns: `Promise<permissionresponse>`

A Promise that resolves to a `PermissionResponse` object containing the permission status.

Example

```tsx
import { requestRecordingPermissionsAsync } from 'expo-audio';

const checkPermissions = async () => {
  const { status, granted } = await requestRecordingPermissionsAsync();

  if (granted) {
    console.log('Recording permission granted');
  } else {
    console.log('Recording permission denied:', status);
  }
};
```

### `Audio.requestRecordingPermissionsAsync()`

Supported platforms: Android, iOS, tvOS, Web.

Requests permission to record audio from the microphone.

This function prompts the user for microphone access permission, which is required for audio recording functionality. On iOS, this will show the system permission dialog. On Android, this requests the `RECORD_AUDIO` permission.

Returns: `Promise<permissionresponse>`

A Promise that resolves to a `PermissionResponse` object containing the permission status.

Example

```tsx
import { requestRecordingPermissionsAsync } from 'expo-audio';

const checkPermissions = async () => {
  const { status, granted } = await requestRecordingPermissionsAsync();

  if (granted) {
    console.log('Recording permission granted');
  } else {
    console.log('Recording permission denied:', status);
  }
};
```

### `Audio.setAudioModeAsync(mode)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `mode` | [Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)<[AudioMode](#audiomode)\> | Partial audio mode configuration object. Only specified properties will be updated. |

  

Configures the global audio behavior and session settings.

This function allows you to control how your app's audio interacts with other apps, background playback behavior, audio routing, and interruption handling.

Returns: `Promise<void>`

A Promise that resolves when the audio mode has been applied.

Example

```tsx
import { setAudioModeAsync } from 'expo-audio';

// Configure audio for background playback with mixing
await setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'mixWithOthers'
});

// Configure audio for recording
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true
});
```

### `Audio.setIsAudioActiveAsync(active)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Whether audio should be active (`true`) or disabled (`false`). |

  

Enables or disables the audio subsystem globally.

When set to `false`, this will pause all audio playback and prevent new audio from playing. This is useful for implementing app-wide audio controls or responding to system events.

Returns: `Promise<void>`

A Promise that resolves when the audio state has been updated.

Example

```tsx
import { setIsAudioActiveAsync } from 'expo-audio';

// Disable all audio when app goes to background
const handleAppStateChange = async (nextAppState) => {
  if (nextAppState === 'background') {
    await setIsAudioActiveAsync(false);
  } else if (nextAppState === 'active') {
    await setIsAudioActiveAsync(true);
  }
};
```

## Event Subscriptions

### `Audio.useAudioSampleListener(player, listener)`

Supported platforms: Android, iOS, tvOS, Web.

| Parameter | Type | Description |
| --- | --- | --- |
| `player` | [AudioPlayer](#audioplayer) | The `AudioPlayer` instance to sample audio from. |
| `listener` | (data: [AudioSample](#audiosample)) => void | Function called with each audio sample containing waveform data. |

  

Hook that sets up audio sampling for an `AudioPlayer` and calls a listener with audio data.

This hook enables audio sampling on the player (if supported) and subscribes to audio sample updates. Audio sampling provides real-time access to audio waveform data for visualization or analysis.

> **Note:** Audio sampling requires `RECORD_AUDIO` permission on Android and is not supported on all platforms.

Returns: `void`

Example

```tsx
import { useEffect } from 'react';
import { useAudioPlayer, useAudioSampleListener, requestRecordingPermissionsAsync } from 'expo-audio';

function AudioVisualizerComponent() {
  const player = useAudioPlayer(require('./music.mp3'));

  // if required on Android, request recording permissions
  useEffect(() => {
    async function requestPermission() {
      const { granted } = await requestRecordingPermissionsAsync();
      if (granted) {
        console.log("Permission granted");
      }
    }

    requestPermission();
   }, []);

  useAudioSampleListener(player, (sample) => {
    // Use sample.channels array for audio visualization
    console.log('Audio sample:', sample.channels[0].frames);
  });

  return <AudioWaveform player={player} />;
}
```

## Types

### `AndroidAudioEncoder`

Supported platforms: Android.

Literal Type: `string`

Audio encoder options for Android recording.

Specifies the audio codec used to encode recorded audio on Android. Different encoders offer different quality, compression, and compatibility trade-offs.

Acceptable values are: `'default'` | `'amr_nb'` | `'amr_wb'` | `'aac'` | `'he_aac'` | `'aac_eld'`

### `AndroidOutputFormat`

Supported platforms: Android.

Literal Type: `string`

Audio output format options for Android recording.

Specifies the container format for recorded audio files on Android. Different formats have different compatibility and compression characteristics.

Acceptable values are: `'default'` | `'3gp'` | `'mpeg4'` | `'amrnb'` | `'amrwb'` | `'aac_adts'` | `'mpeg2ts'` | `'webm'`

### `AudioEvents`

Supported platforms: Android, iOS, tvOS, Web.

Event types that an `AudioPlayer` can emit.

These events allow you to listen for changes in playback state and receive real-time audio data. Use `player.addListener()` to subscribe to these events.

| Property | Type | Description |
| --- | --- | --- |
| audioSampleUpdate | (data: [AudioSample](#audiosample)) => void | Fired when audio sampling is enabled and new sample data is available. |
| playbackStatusUpdate | (status: [AudioStatus](#audiostatus)) => void | Fired when the player's status changes (play/pause/seek/load and so on.). |

> **Deprecated:** Use `AudioPlayerOptions` instead. Options for audio loading behavior.

### `AudioLoadOptions`

Supported platforms: Android, iOS, tvOS, Web.

Type: [AudioPlayerOptions](#audioplayeroptions)

### `AudioLockScreenOptions`

Supported platforms: Android, iOS, tvOS, Web.

Options for configuring which playback controls should be displayed on the lock screen.

| Property | Type | Description |
| --- | --- | --- |
| showSeekBackward(optional) | `boolean` | Whether the seek backward button should be displayed on the lock screen. |
| showSeekForward(optional) | `boolean` | Whether the seek forward button should be displayed on the lock screen. |

### `AudioMetadata`

Supported platforms: Android, iOS, tvOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| albumTitle(optional) | `string` | - |
| artist(optional) | `string` | - |
| artworkUrl(optional) | `string` | - |
| title(optional) | `string` | - |

### `AudioMode`

Supported platforms: Android, iOS, tvOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| allowsBackgroundRecording(optional) | `boolean` | Supported platforms: Android, iOS. Whether audio recording should continue when the app moves to the background. Default: `false` |
| allowsRecording(optional) | `boolean` | Supported platforms: iOS. Whether the audio session allows recording. Default: `false` |
| interruptionMode(optional) | [InterruptionMode](#interruptionmode) | Determines how the audio session interacts with other audio sessions.
-   `'doNotMix'`: Requests exclusive audio focus. Other apps will pause their audio.
-   `'duckOthers'`: Requests audio focus with ducking. Other apps lower their volume but continue playing.
-   `'mixWithOthers'`: Audio plays alongside other apps without interrupting them. On Android, this means no audio focus is requested. Best suited for sound effects, UI feedback, or short audio clips.

. Default: `'mixWithOthers'` |
| interruptionModeAndroid(optional) | [InterruptionModeAndroid](#interruptionmodeandroid) | Deprecated: Use interruptionMode instead, which now works on both platforms. . Supported platforms: Android. Determines how the audio session interacts with other sessions on Android. |
| playsInSilentMode | `boolean` | Supported platforms: iOS. Determines if audio playback is allowed when the device is in silent mode. |
| shouldPlayInBackground(optional) | `boolean` | Whether the audio session stays active when the app moves to the background. Note: On Android, you have to enable the lockscreen controls with setActiveForLockScreen for sustained background playback. Otherwise, the audio will stop after approximately 3 minutes of background playback (OS limitation). Make sure to also appropriately configure the config-plugin. Default: `false` |
| shouldRouteThroughEarpiece(optional) | `boolean` | Whether the audio should route through the earpiece. On iOS, this only has an effect when `allowsRecording` is `true` (i.e., the audio session category is `.playAndRecord`). When `false` (the default), audio is routed through the speaker. Default: `false` |

### `AudioPlayerOptions`

Supported platforms: Android, iOS, tvOS, Web.

Options for configuring audio player behavior.

| Property | Type | Description |
| --- | --- | --- |
| crossOrigin(optional) | `'anonymous' | 'use-credentials'` | Supported platforms: Web. Determines the [cross origin policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) used by the underlying native view on web. If `undefined` (default), does not use CORS at all. If set to `'anonymous'`, the audio will be loaded with CORS enabled. Note that some audio may not play if CORS is enabled, depending on the CDN settings. If you encounter issues, consider adjusting the `crossOrigin` property. Default: `undefined` |
| downloadFirst(optional) | `boolean` | Supported platforms: Android, iOS, Web. If set to `true`, the system will attempt to download the resource to the device before loading. This value defaults to `false`. Works with:
-   Local assets from `require('path/to/file')`
-   Remote HTTP/HTTPS URLs
-   Asset objects

. When enabled, this ensures the audio file is fully downloaded before playback begins. This can improve playback performance and reduce buffering, especially for users managing multiple audio players simultaneously. On Android and iOS, this will download the audio file to the device's tmp directory before playback begins. The system will purge the file at its discretion. On web, this will download the audio file to the user's device memory and make it available for the user to play. The system will usually purge the file from memory after a reload or on memory pressure. On web, CORS restrictions apply to the blob url, so you need to make sure the server returns the `Access-Control-Allow-Origin` header. |
| keepAudioSessionActive(optional) | `boolean` | Supported platforms: iOS. If set to `true`, the audio session will not be deactivated when this player pauses or finishes playback. This prevents interrupting other audio sources (like videos) when the audio ends. Useful for sound effects that should not interfere with ongoing video playback or other audio. The audio session for this player will not be deactivated automatically when the player finishes playback. Note: If needed, you can manually deactivate the audio session using setIsAudioActiveAsync(false). Default: `false` |
| preferredForwardBufferDuration(optional) | `number` | Supported platforms: Android, iOS. The duration in seconds the player should buffer ahead of the current playback position. A higher value improves playback stability at the cost of more memory/network usage.

-   **iOS**: Maps to `AVPlayerItem.preferredForwardBufferDuration`. A value of `0` lets the system decide.
-   **Android**: Configures ExoPlayer's `DefaultLoadControl` max buffer duration.
-   **Web**: Not applicable (browser manages buffering).

. Default: `0 (system default)` |
| updateInterval(optional) | `number` | Supported platforms: Android, iOS, Web. How often (in milliseconds) to emit playback status updates. Defaults to 500ms. Default: `500ms`. Example

```tsx
import { useAudioPlayer } from 'expo-audio';

export default function App() {
  const player = useAudioPlayer(source);

  // High-frequency updates for smooth progress bars
  const player = useAudioPlayer(source, { updateInterval: 100 });

  // Standard updates (default behavior)
  const player = useAudioPlayer(source, { updateInterval: 500 });

  // Low-frequency updates for better performance
  const player = useAudioPlayer(source, { updateInterval: 1000 });
}
```

 |

### `AudioPlaylistEvents`

Supported platforms: Android, iOS, tvOS, Web.

Event types that an `AudioPlaylist` can emit.

These events allow you to listen for changes in playlist playback state. Use `playlist.addListener()` to subscribe to these events.

| Property | Type | Description |
| --- | --- | --- |
| playlistStatusUpdate | (status: [AudioPlaylistStatus](#audioplayliststatus)) => void | Fired when the playlist's status changes (play/pause/seek/load/track change). |
| trackChanged | `(data: { currentIndex: number, previousIndex: number }) => void` | Fired when the current track changes (next/previous/skip). |

### `AudioPlaylistLoopMode`

Supported platforms: Android, iOS, tvOS, Web.

Literal Type: `string`

Loop mode for audio playlist playback.

-   `'none'`: No looping. Playback stops after the last track.
-   `'single'`: Loops the current track indefinitely.
-   `'all'`: Loops the entire playlist, returning to the first track after the last.

Acceptable values are: `'none'` | `'single'` | `'all'`

### `AudioPlaylistOptions`

Supported platforms: Android, iOS, tvOS, Web.

Options for configuring an audio playlist.

| Property | Type | Description |
| --- | --- | --- |
| crossOrigin(optional) | `'anonymous' | 'use-credentials'` | Supported platforms: Web. Sets the `crossOrigin` attribute on the `<audio>` elements used for playback. Required for CORS-enabled audio files when you need to access audio data. Default: `undefined` |
| loop(optional) | [AudioPlaylistLoopMode](#audioplaylistloopmode) | Loop mode for the playlist.
-   `'none'`: No looping (default)
-   `'single'`: Loop the current track
-   `'all'`: Loop the entire playlist

. Default: `'none'` |
| sources(optional) | [AudioSource[]](#audiosource) | Initial sources to add to the playlist. Each source can be a local asset, remote URL, or null. Default: `[]` |
| updateInterval(optional) | `number` | How often (in milliseconds) to emit playback status updates. Defaults to 500ms. Default: `500` |

### `AudioPlaylistStatus`

Supported platforms: Android, iOS, tvOS, Web.

Status information for an audio playlist.

| Property | Type | Description |
| --- | --- | --- |
| currentIndex | `number` | Index of the currently playing track in the playlist. |
| currentTime | `number` | Current playback position in seconds. |
| didJustFinish | `boolean` | Whether the current track just finished playing. |
| duration | `number` | Total duration of the current track in seconds. |
| id | `string` | Unique identifier for the playlist instance. |
| isBuffering | `boolean` | Whether the player is buffering. |
| isLoaded | `boolean` | Whether the current track has finished loading. |
| loop | [AudioPlaylistLoopMode](#audioplaylistloopmode) | Current loop mode. |
| muted | `boolean` | Whether the player is muted. |
| playbackRate | `number` | Current playback rate (1.0 = normal speed). |
| playing | `boolean` | Whether the player is currently playing. |
| trackCount | `number` | Total number of tracks in the playlist. |
| volume | `number` | Current volume level (0.0 to 1.0). |

### `AudioSample`

Supported platforms: Android, iOS, tvOS, Web.

Represents a single audio sample containing waveform data from all audio channels.

Audio samples are provided in real-time when audio sampling is enabled on an `AudioPlayer`. Each sample contains the raw PCM audio data for all channels (mono has 1 channel, stereo has 2). This data can be used for audio visualization, analysis, or processing.

| Property | Type | Description |
| --- | --- | --- |
| channels | [AudioSampleChannel[]](#audiosamplechannel) | Array of audio channels, each containing PCM frame data. Stereo audio will have 2 channels (left/right). |
| timestamp | `number` | Timestamp of this sample relative to the audio track's timeline, in seconds. |

### `AudioSampleChannel`

Supported platforms: Android, iOS, tvOS, Web.

Represents audio data for a single channel (for example, left or right in stereo audio).

Contains the raw PCM (Pulse Code Modulation) audio frames for this channel. Frame values are normalized between -1.0 and 1.0, where 0 represents silence.

| Property | Type | Description |
| --- | --- | --- |
| frames | `number[]` | Array of PCM audio frame values, each between -1.0 and 1.0. |

### `AudioSource`

Supported platforms: Android, iOS, tvOS, Web.

Type: `string` or `number` or `null` or `object` shaped as below:

| Property | Type | Description |
| --- | --- | --- |
| assetId(optional) | `number` | The asset ID of a local audio asset, acquired with the `require` function. This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored. |
| headers(optional) | `Record<string, string>` | An object representing the HTTP headers to send along with the request for a remote audio source. On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain. |
| name(optional) | `string` | An optional display name for the audio source. Useful for showing track names in a queue or playlist UI. |
| uri(optional) | `string` | A string representing the resource identifier for the audio, which could be an HTTPS address, a local file path, or the name of a static audio file resource. |

### `AudioSourceInfo`

Supported platforms: Android, iOS, tvOS, Web.

Represents audio source information returned from native. This is the object returned when reading sources from a queue.

| Property | Type | Description |
| --- | --- | --- |
| name(optional) | `string` | An optional display name for the audio source. |
| uri(optional) | `string` | A string representing the resource identifier for the audio. |

### `AudioStatus`

Supported platforms: Android, iOS, tvOS, Web.

Comprehensive status information for an `AudioPlayer`.

This object contains all the current state information about audio playback, including playback position, duration, loading state, and playback settings. Used by `useAudioPlayerStatus()` to provide real-time status updates.

| Property | Type | Description |
| --- | --- | --- |
| currentTime | `number` | Current playback position in seconds. |
| didJustFinish | `boolean` | Whether the audio just finished playing. |
| duration | `number` | Total duration of the audio in seconds, or 0 if not yet determined. |
| id | `string` | Unique identifier for the player instance. |
| isBuffering | `boolean` | Whether the player is currently buffering data. |
| isLoaded | `boolean` | Whether the audio has finished loading and is ready to play. |
| loop | `boolean` | Whether the audio is set to loop when it reaches the end. |
| mediaServicesDidReset(optional) | `boolean` | Supported platforms: iOS. Whether the media services were reset by the system. When `true`, the player was interrupted because the system's media daemon crashed. The player will automatically attempt to recover by reloading the source and resuming playback. |
| mute | `boolean` | Whether the player is currently muted. |
| playbackRate | `number` | Current playback rate (1.0 = normal speed). |
| playbackState | `string` | String representation of the player's internal playback state. |
| playing | `boolean` | Whether the audio is currently playing. |
| reasonForWaitingToPlay | `string` | Reason why the player is waiting to play (if applicable). |
| shouldCorrectPitch(optional) | `boolean` | Whether pitch correction is enabled for rate changes. Default: `true` |
| timeControlStatus | `string` | String representation of the player's time control status (playing/paused/waiting). |

### `BitRateStrategy`

Supported platforms: Android, iOS, tvOS, Web.

Literal Type: `string`

Bit rate strategies for audio encoding.

Determines how the encoder manages bit rate during recording, affecting file size consistency and quality characteristics.

Acceptable values are: `'constant'` | `'longTermAverage'` | `'variableConstrained'` | `'variable'`

### `InterruptionMode`

Supported platforms: Android, iOS, tvOS, Web.

Literal Type: `string`

Audio interruption behavior modes.

Controls how your app's audio interacts with other apps' audio.

-   `'doNotMix'`: Requests exclusive audio focus. Other apps will pause their audio.
    
-   `'duckOthers'`: Requests audio focus with ducking. Other apps lower their volume but continue playing.
    
-   `'mixWithOthers'`: Audio plays alongside other apps without interrupting them.
    
    On Android, this means no audio focus is requested. Best suited for sound effects, UI feedback, or short audio clips. Note that on Android your app won't receive audio focus loss callbacks (for example, during phone calls) when using this mode.
    

> **Note:** When using `setActiveForLockScreen`, this must be set to `doNotMix`.

Default: `'mixWithOthers'`

Acceptable values are: `'mixWithOthers'` | `'doNotMix'` | `'duckOthers'`

> **Deprecated:** Use `InterruptionMode` instead, which now works on both platforms.

### `InterruptionModeAndroid`

Supported platforms: Android, iOS, tvOS, Web.

Type: [InterruptionMode](#interruptionmode)

### `PermissionExpiration`

Supported platforms: Android, iOS, tvOS, Web.

Literal Type: `union`

Permission expiration time. Currently, all permissions are granted permanently.

Acceptable values are: `'never'` | `number`

### `PermissionResponse`

Supported platforms: Android, iOS, tvOS, Web.

An object obtained by permissions get and request functions.

| Property | Type | Description |
| --- | --- | --- |
| canAskAgain | `boolean` | Indicates if user can be asked again for specific permission. If not, one should be directed to the Settings app in order to enable/disable the permission. |
| expires | `PermissionExpiration` | Determines time when the permission expires. |
| granted | `boolean` | A convenience boolean that indicates if the permission is granted. |
| status | `PermissionStatus` | Determines the status of the permission. |

### `PitchCorrectionQuality`

Supported platforms: iOS.

Literal Type: `string`

Pitch correction quality settings for audio playback rate changes.

When changing playback rate, pitch correction can be applied to maintain the original pitch. Different quality levels offer trade-offs between processing power and audio quality.

Acceptable values are: `'low'` | `'medium'` | `'high'`

### `PreloadOptions`

Supported platforms: Android, iOS, tvOS, Web.

Options for configuring audio preloading behavior.

| Property | Type | Description |
| --- | --- | --- |
| preferredForwardBufferDuration(optional) | `number` | Supported platforms: Android, iOS. The duration in seconds the player should buffer ahead of the current playback position. A higher value improves playback stability at the cost of more memory/network usage.
-   **iOS**: Maps to `AVPlayerItem.preferredForwardBufferDuration`. A value of `0` lets the system decide.
-   **Android**: Configures ExoPlayer's buffer duration.
-   **Web**: Not applicable (browser manages buffering).

. Default: `10` |

### `RecorderState`

Supported platforms: Android, iOS, tvOS, Web.

Current state information for an `AudioRecorder`.

This object contains detailed information about the recorder's current state, including recording status, duration, and technical details. This is what you get when calling `recorder.getStatus()` or using `useAudioRecorderState()`.

| Property | Type | Description |
| --- | --- | --- |
| canRecord | `boolean` | Whether the recorder is ready and able to record. |
| durationMillis | `number` | Duration of the current recording in milliseconds. |
| isRecording | `boolean` | Whether recording is currently in progress. |
| mediaServicesDidReset | `boolean` | Whether the media services have been reset (typically indicates a system interruption). |
| metering(optional) | `number` | Current audio level/volume being recorded (if metering is enabled). |
| url | `string | null` | File URL where the recording will be saved, if available. |

### `RecordingEvents`

Supported platforms: Android, iOS, tvOS, Web.

Event types that an `AudioRecorder` can emit.

These events are used internally by `expo-audio` hooks to provide real-time status updates. Use `useAudioRecorderState()` or the `statusListener` parameter in `useAudioRecorder()` instead of subscribing directly.

| Property | Type | Description |
| --- | --- | --- |
| recordingStatusUpdate | (status: [RecordingStatus](#recordingstatus)) => void | Fired when the recorder's status changes (start/stop/pause/error, and so on). |

### `RecordingInput`

Supported platforms: Android, iOS, tvOS, Web.

Represents an available audio input device for recording.

This type describes audio input sources like built-in microphones, external microphones, or other audio input devices that can be used for recording. Each input has an identifying information that can be used to select the preferred recording source.

| Property | Type | Description |
| --- | --- | --- |
| name | `string` | Human-readable name of the audio input device. |
| type | `string` | Type or category of the input device (for example, 'Built-in Microphone', 'External Microphone'). |
| uid | `string` | Unique identifier for the input device, used to select the input ('Built-in Microphone', 'External Microphone') for recording. |

### `RecordingOptions`

Supported platforms: Android, iOS, tvOS, Web.

| Property | Type | Description |
| --- | --- | --- |
| android | [RecordingOptionsAndroid](#recordingoptionsandroid) | Supported platforms: Android. Recording options for the Android platform. |
| bitRate | `number` | The desired bit rate. . Example. `128000` |
| extension | `string` | The desired file extension. . Example. `.caf` |
| ios | [RecordingOptionsIos](#recordingoptionsios) | Supported platforms: iOS. Recording options for the iOS platform. |
| isMeteringEnabled(optional) | `boolean` | A boolean that determines whether audio level information will be part of the status object under the "metering" key. |
| numberOfChannels | `number` | The desired number of channels. . Example. `2` |
| sampleRate | `number` | The desired sample rate. . Example. `44100` |
| web | [RecordingOptionsWeb](#recordingoptionsweb) | Supported platforms: Web. Recording options for the Web platform. |

### `RecordingOptionsAndroid`

Supported platforms: Android.

Recording configuration options specific to Android.

Android recording uses `MediaRecorder` with options for format, encoder, and file constraints. These settings control the output format and quality characteristics.

| Property | Type | Description |
| --- | --- | --- |
| audioEncoder | [AndroidAudioEncoder](#androidaudioencoder) | The desired audio encoder. See the [`AndroidAudioEncoder`](#androidaudioencoder) type for all valid values. |
| audioSource(optional) | [RecordingSource](#recordingsource) | The desired audio Source. See the [`RecordingSource`](#recordingsource) type for all valid values. |
| extension(optional) | `string` | The desired file extension. . Example. `.caf` |
| maxFileSize(optional) | `number` | The desired maximum file size in bytes, after which the recording will stop (but `stopAndUnloadAsync()` must still be called after this point). . Example. `65536` |
| outputFormat | [AndroidOutputFormat](#androidoutputformat) | The desired file format. See the [`AndroidOutputFormat`](#androidoutputformat) type for all valid values. |
| sampleRate(optional) | `number` | The desired sample rate. . Example. `44100` |

### `RecordingOptionsIos`

Supported platforms: iOS.

Recording configuration options specific to iOS.

iOS recording uses `AVAudioRecorder` with extensive format and quality options. These settings provide fine-grained control over the recording characteristics.

| Property | Type | Description |
| --- | --- | --- |
| audioQuality | [AudioQuality](#audioquality) | number | The desired audio quality. See the [`AudioQuality`](#audioquality) enum for all valid values. |
| bitDepthHint(optional) | `number` | The desired bit depth hint. . Example. `16` |
| bitRateStrategy(optional) | `number` | The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`. |
| extension(optional) | `string` | The desired file extension. . Example. `.caf` |
| linearPCMBitDepth(optional) | `number` | The desired PCM bit depth. . Example. `16` |
| linearPCMIsBigEndian(optional) | `boolean` | A boolean describing if the PCM data should be formatted in big endian. |
| linearPCMIsFloat(optional) | `boolean` | A boolean describing if the PCM data should be encoded in floating point or integral values. |
| outputFormat(optional) | string | [IOSOutputFormat](#iosoutputformat) | number | The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values. |
| sampleRate(optional) | `number` | The desired sample rate. . Example. `44100` |

### `RecordingOptionsWeb`

Supported platforms: Web.

Recording options for the web.

Web recording uses the `MediaRecorder` API, which has different capabilities compared to native platforms. These options map directly to `MediaRecorder` settings.

| Property | Type | Description |
| --- | --- | --- |
| bitsPerSecond(optional) | `number` | Target bits per second for the recording. |
| mimeType(optional) | `string` | MIME type for the recording (for example, 'audio/webm', 'audio/mp4'). |

### `RecordingSource`

Supported platforms: Android.

Literal Type: `string`

Recording source for android.

An audio source defines both a default physical source of audio signal, and a recording configuration.

-   `camcorder`: Microphone audio source tuned for video recording, with the same orientation as the camera if available.
-   `default`: The default audio source.
-   `mic`: Microphone audio source.
-   `unprocessed`: Microphone audio source tuned for unprocessed (raw) sound if available, behaves like `default` otherwise.
-   `voice_communication`: Microphone audio source tuned for voice communications such as VoIP. It will for instance take advantage of echo cancellation or automatic gain control if available.
-   `voice_performance`: Source for capturing audio meant to be processed in real time and played back for live performance (e.g karaoke). The capture path will minimize latency and coupling with playback path.
-   `voice_recognition`: Microphone audio source tuned for voice recognition.

> **See:** [https://developer.android.com/reference/android/media/MediaRecorder.AudioSource](https://developer.android.com/reference/android/media/MediaRecorder.AudioSource)

Acceptable values are: `'camcorder'` | `'default'` | `'mic'` | `'remote_submix'` | `'unprocessed'` | `'voice_communication'` | `'voice_performance'` | `'voice_recognition'`

### `RecordingStartOptions`

Supported platforms: Android, iOS, tvOS, Web.

Options for controlling how audio recording is started.

| Property | Type | Description |
| --- | --- | --- |
| atTime(optional) | `number` | Supported platforms: iOS. The time in seconds to wait before starting the recording. If not provided, recording starts immediately. **Platform behavior:**
-   Android: Ignored, recording starts immediately
-   iOS: Uses native AVAudioRecorder.record(atTime:) for precise timing.
-   Web: Ignored, recording starts immediately

 |
| forDuration(optional) | `number` | Supported platforms: Android, iOS, Web. The duration in seconds after which recording should automatically stop. If not provided, recording continues until manually stopped. |

### `RecordingStatus`

Supported platforms: Android, iOS, tvOS, Web.

Status information for recording operations from the event system.

This type represents the status data emitted by `recordingStatusUpdate` events. It contains high-level information about the recording session and any errors. Used internally by the event system. Most users should use `useAudioRecorderState()` instead.

| Property | Type | Description |
| --- | --- | --- |
| error | `string | null` | Error message if an error occurred, `null` otherwise. |
| hasError | `boolean` | Whether an error occurred during recording. |
| id | `string` | Unique identifier for the recording session. |
| isFinished | `boolean` | Whether the recording has finished (stopped). |
| mediaServicesDidReset(optional) | `boolean` | Supported platforms: iOS. Whether the media services were reset by the system. When `true`, the recording was interrupted because the system's media daemon crashed. The recorder is now invalid and must be re-prepared by calling `prepareToRecordAsync()`. |
| url | `string | null` | File URL of the completed recording, if available. |

## Enums

### `AudioQuality`

Supported platforms: Android, iOS, tvOS, Web.

Audio quality levels for recording.

Predefined quality levels that balance file size and audio fidelity. Higher quality levels produce better sound but larger files and require more processing power.

#### `MIN`

`AudioQuality.MIN = 0`

Minimum quality: smallest file size, lowest fidelity.

#### `LOW`

`AudioQuality.LOW = 32`

Low quality: good for voice recordings where file size matters.

#### `MEDIUM`

`AudioQuality.MEDIUM = 64`

Medium quality: balanced option for most use cases.

#### `HIGH`

`AudioQuality.HIGH = 96`

High quality: good fidelity, larger file size.

#### `MAX`

`AudioQuality.MAX = 127`

Maximum quality: best fidelity, largest file size.

### `IOSOutputFormat`

Supported platforms: iOS.

Audio output format options for iOS recording.

Comprehensive enum of audio formats supported by iOS for recording. Each format has different characteristics in terms of quality, file size, and compatibility. Some formats like LINEARPCM offer the highest quality but larger file sizes, while compressed formats like AAC provide good quality with smaller files.

#### `MPEGLAYER1`

`IOSOutputFormat.MPEGLAYER1 = ".mp1"`

#### `MPEGLAYER2`

`IOSOutputFormat.MPEGLAYER2 = ".mp2"`

#### `MPEGLAYER3`

`IOSOutputFormat.MPEGLAYER3 = ".mp3"`

#### `MPEG4AAC`

`IOSOutputFormat.MPEG4AAC = "aac "`

#### `MPEG4AAC_ELD`

`IOSOutputFormat.MPEG4AAC_ELD = "aace"`

#### `MPEG4AAC_ELD_SBR`

`IOSOutputFormat.MPEG4AAC_ELD_SBR = "aacf"`

#### `MPEG4AAC_ELD_V2`

`IOSOutputFormat.MPEG4AAC_ELD_V2 = "aacg"`

#### `MPEG4AAC_HE`

`IOSOutputFormat.MPEG4AAC_HE = "aach"`

#### `MPEG4AAC_LD`

`IOSOutputFormat.MPEG4AAC_LD = "aacl"`

#### `MPEG4AAC_HE_V2`

`IOSOutputFormat.MPEG4AAC_HE_V2 = "aacp"`

#### `MPEG4AAC_SPATIAL`

`IOSOutputFormat.MPEG4AAC_SPATIAL = "aacs"`

#### `AC3`

`IOSOutputFormat.AC3 = "ac-3"`

#### `AES3`

`IOSOutputFormat.AES3 = "aes3"`

#### `APPLELOSSLESS`

`IOSOutputFormat.APPLELOSSLESS = "alac"`

#### `ALAW`

`IOSOutputFormat.ALAW = "alaw"`

#### `AUDIBLE`

`IOSOutputFormat.AUDIBLE = "AUDB"`

#### `60958AC3`

`IOSOutputFormat.60958AC3 = "cac3"`

#### `MPEG4CELP`

`IOSOutputFormat.MPEG4CELP = "celp"`

#### `ENHANCEDAC3`

`IOSOutputFormat.ENHANCEDAC3 = "ec-3"`

#### `MPEG4HVXC`

`IOSOutputFormat.MPEG4HVXC = "hvxc"`

#### `ILBC`

`IOSOutputFormat.ILBC = "ilbc"`

#### `APPLEIMA4`

`IOSOutputFormat.APPLEIMA4 = "ima4"`

#### `LINEARPCM`

`IOSOutputFormat.LINEARPCM = "lpcm"`

#### `MACE3`

`IOSOutputFormat.MACE3 = "MAC3"`

#### `MACE6`

`IOSOutputFormat.MACE6 = "MAC6"`

#### `AMR`

`IOSOutputFormat.AMR = "samr"`

#### `AMR_WB`

`IOSOutputFormat.AMR_WB = "sawb"`

#### `DVIINTELIMA`

`IOSOutputFormat.DVIINTELIMA = 1836253201`

#### `MICROSOFTGSM`

`IOSOutputFormat.MICROSOFTGSM = 1836253233`

#### `QUALCOMM`

`IOSOutputFormat.QUALCOMM = "Qclp"`

#### `QDESIGN2`

`IOSOutputFormat.QDESIGN2 = "QDM2"`

#### `QDESIGN`

`IOSOutputFormat.QDESIGN = "QDMC"`

#### `MPEG4TWINVQ`

`IOSOutputFormat.MPEG4TWINVQ = "twvq"`

#### `ULAW`

`IOSOutputFormat.ULAW = "ulaw"`

### `PermissionStatus`

Supported platforms: Android, iOS, tvOS, Web.

#### `DENIED`

`PermissionStatus.DENIED = "denied"`

User has denied the permission.

#### `GRANTED`

`PermissionStatus.GRANTED = "granted"`

User has granted the permission.

#### `UNDETERMINED`

`PermissionStatus.UNDETERMINED = "undetermined"`

User hasn't granted or denied the permission yet.
