---
title: Widgets
description: A library to build iOS home screen widgets and Live Activities using Expo UI components.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-widgets'
packageName: 'expo-widgets'
platforms: ['ios']
isAlpha: true
---

# Expo Widgets

A library to build iOS home screen widgets and Live Activities using Expo UI components.
iOS

> This library is currently in alpha and subject to breaking changes. It is not available in the Expo Go app, use [development builds](/develop/development-builds/introduction) to try it out.

`expo-widgets` enables the creation of iOS home screen widgets and Live Activities using Expo UI components, without writing native code. It provides a simple API for creating and updating widgets timeline, as well as starting and managing Live Activities. Layout can be built using [`expo/ui`](/versions/latest/sdk/ui/swift-ui) components and modifiers.

## Installation

```sh
npx expo install expo-widgets
```

If you are installing this in an [existing React Native app](/bare/overview), make sure to [install `expo`](/bare/installing-expo-modules) in your project.

## Configuration in app config

You can configure `expo-widgets` using its built-in [config plugin](/config-plugins/introduction) if you use config plugins in your project ([Continuous Native Generation (CNG)](/workflow/continuous-native-generation)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

### Example app.json with config plugin

```json
{
  "expo": {
    "plugins": [
      [
        "expo-widgets",
        {
          "widgets": [
            {
              "name": "MyWidget",
              "displayName": "My Widget",
              "description": "A sample home screen widget",
              "supportedFamilies": ["systemSmall", "systemMedium", "systemLarge"]
            }
          ]
        }
      ]
    ]
  }
}
```

### Configurable properties

| Name | Default | Description |
| --- | --- | --- |
| `bundleIdentifier` | `"<app bundle identifier>.ExpoWidgetsTarget"` | The bundle identifier for the widget extension target. If not specified, defaults to `<main app bundle identifier>.ExpoWidgetsTarget`. |
| `groupIdentifier` | `"group.<app bundle identifier>"` | The app group identifier used for communication and data sharing between the main app and widgets. This is required for widgets to work properly. If not specified, defaults to `group.<main app bundle identifier>`. |
| `enablePushNotifications` | `false` | Whether to enable push notifications for Live Activities. When enabled, this adds the `aps-environment` entitlement and sets `ExpoLiveActivity_EnablePushNotifications` in the **Info.plist**. |
| `widgets` | - | An array of widget configurations. Each widget in the array will be generated as a separate widget kind in your widget extension. |
| `widgets[].name` | - | The internal name (identifier) of the widget. This is used as the Swift struct name and should be a valid Swift identifier (no spaces or special characters). |
| `widgets[].displayName` | - | The user-facing name of the widget that appears in the widget gallery when users add widgets to their home screen. |
| `widgets[].description` | - | A brief description of what the widget does. This appears in the widget gallery to help users understand the widget's purpose. |
| `widgets[].supportedFamilies` | - | An array of widget sizes that this widget supports. Available options:
-   `systemSmall` - Small square widget (2x2 grid)
-   `systemMedium` - Medium rectangular widget (4x2 grid)
-   `systemLarge` - Large square widget (4x4 grid)
-   `systemExtraLarge` - Extra large widget (iPad only, 6x4 grid)
-   `accessoryCircular` - Circular widget for Lock Screen
-   `accessoryRectangular` - Rectangular widget for Lock Screen
-   `accessoryInline` - Inline text widget for Lock Screen

 |

### Full example with all options

```json
{
  "expo": {
    "plugins": [
      [
        "expo-widgets",
        {
          "bundleIdentifier": "com.example.myapp.widgets",
          "groupIdentifier": "group.com.example.myapp",
          "enablePushNotifications": true,
          "widgets": [
            {
              "name": "StatusWidget",
              "displayName": "Status",
              "description": "Shows your current status at a glance",
              "supportedFamilies": ["systemSmall", "systemMedium"]
            },
            {
              "name": "DetailWidget",
              "displayName": "Details",
              "description": "Shows detailed information",
              "supportedFamilies": ["systemMedium", "systemLarge"]
            },
            {
              "name": "LockScreenWidget",
              "displayName": "Quick View",
              "description": "View info on your Lock Screen",
              "supportedFamilies": ["accessoryCircular", "accessoryRectangular", "accessoryInline"]
            }
          ]
        }
      ]
    ]
  }
}
```

## Usage

### Widgets

#### Prerequisite: Creating widget

Start by creating a Widget using the `createWidget` function and pass the widget component marked with the `'widget'` directive.

```tsx
import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

type MyWidgetProps = {
  count: number;
};

const MyWidget = (props: WidgetBase<MyWidgetProps>) => {
  'widget';
  return (
    <VStack>
      <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle('#000000')]}>
        Count: {props.count}
      </Text>
    </VStack>
  );
};

export default createWidget('MyWidget', MyWidget);
```

The widget name (`'MyWidget'`) must match the `name` field in your widget configuration in the [app config](/workflow/configuration).

#### Basic widget

An effective way to update a widget is to use the `updateSnapshot` method. This creates a widget timeline with a single entry that displays immediately.

The example below continues from [Creating widget](/versions/latest/sdk/widgets#prerequisite-creating-widget).

```tsx
import MyWidget from './MyWidget';

// Update the widget
MyWidget.updateSnapshot({ count: 5 });
```

#### Timeline widget

Use `updateTimeline` method to schedule widget updates at specific time. System will automatically update the widget based on the timeline.

The example below continues from [Creating widget](/versions/latest/sdk/widgets#prerequisite-creating-widget).

```tsx
import MyWidget from './MyWidget';

MyWidget.updateTimeline([
  { date: new Date(), props: { count: 1 } },
  { date: new Date(Date.now() + 3600000), props: { count: 2 } }, // 1 hour from now
  { date: new Date(Date.now() + 7200000), props: { count: 3 } }, // 2 hours from now
  { date: new Date(Date.now() + 10800000), props: { count: 4 } }, // 3 hours from now
]);
```

#### Responsive widget

Widget component receives a `family` prop indicating which size is being rendered. Use this to adapt layout for different widget sizes.

```tsx
import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, WidgetBase } from 'expo-widgets';

type WeatherWidgetProps = {
  temperature: number;
  condition: string;
};

const WeatherWidget = (props: WidgetBase<WeatherWidgetProps>) => {
  'widget';
  // Render different layouts based on size
  if (props.family === 'systemSmall') {
    return (
      <VStack>
        <Text>{props.temperature}°</Text>
      </VStack>
    );
  }

  if (props.family === 'systemMedium') {
    return (
      <HStack>
        <Text>{props.temperature}°</Text>
        <Text>{props.condition}</Text>
      </HStack>
    );
  }

  // systemLarge and others
  return (
    <VStack>
      <Text>Temperature: {props.temperature}°</Text>
      <Text>Condition: {props.condition}</Text>
      <Text>Updated: {props.date.toLocaleTimeString()}</Text>
    </VStack>
  );
};

const Widget = createWidget('WeatherWidget', WeatherWidget);
export default Widget;

Widget.updateSnapshot({
  temperature: 72,
  condition: 'Sunny',
});
```

### Live Activities

Live Activities display real-time information on the Lock Screen and in the Dynamic Island on supported devices.

#### Prerequisite: Creating Live Activity

Live Activity layouts must be created once using `createLiveActivity` and marked with the `'widget'` directive.

```tsx
import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

type DeliveryActivityProps = {
  etaMinutes: number;
  status: string;
};

const DeliveryActivity = (props: DeliveryActivityProps) => {
  'widget';
  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold' }), foregroundStyle('#007AFF')]}>
          {props.status}
        </Text>
        <Text>Estimated arrival: {props.etaMinutes} minutes</Text>
      </VStack>
    ),
    compactLeading: <Image systemName="box.truck.fill" color="#007AFF" />,
    compactTrailing: <Text>{props.etaMinutes} min</Text>,
    minimal: <Image systemName="box.truck.fill" color="#007AFF" />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="box.truck.fill" color="#007AFF" />
        <Text modifiers={[font({ size: 12 })]}>Delivering</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 20 })]}>{props.etaMinutes}</Text>
        <Text modifiers={[font({ size: 12 })]}>minutes</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text>Driver: John Smith</Text>
        <Text>Order #12345</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity('DeliveryActivity', DeliveryActivity);
```

#### Starting a Live Activity

The example below continues from [Creating Live Activity](/versions/latest/sdk/widgets#prerequisite-creating-live-activity).

```tsx
import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { Button, View } from 'react-native';
import DeliveryActivity from './DeliveryActivity';

function App() {
  const startDeliveryTracking = () => {
    // Start the Live Activity
    const instance = DeliveryActivity.start({
      etaMinutes: 15,
      status: 'Your delivery is on the way',
    });
    // Store instance
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Start Delivery Tracking" onPress={startDeliveryTracking} />
    </View>
  );
}
export default App;
```

#### Updating a Live Activity

The example below continues from [Starting a Live Activity](/versions/latest/sdk/widgets#starting-a-live-activity).

```tsx
import { LiveActivity } from 'expo-widgets';

function updateDelivery(instance: LiveActivity<DeliveryActivityProps>) {
  instance.update({
    etaMinutes: 2,
    status: 'Delivery arriving soon!',
  });
}
```

## API

```tsx
import { createWidget, createLiveActivity } from 'expo-widgets';
```

## Classes

### `LiveActivity`

Supported platforms: iOS.

Represents a Live Activity instance. Provides methods to update its content and end it.

LiveActivity Methods

### `addPushTokenListener(listener)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `listener` | (event: [PushTokenEvent](#pushtokenevent)) => void | Callback invoked when a new push token is available. |

  

Adds a listener for push token update events on this Live Activity instance. The token can be used to send content updates to this specific activity via APNs.

Returns: `EventSubscription`

An event subscription that can be used to remove the listener.

### `end(dismissalPolicy)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `dismissalPolicy`(optional) | [LiveActivityDismissalPolicy](#liveactivitydismissalpolicy) | Controls when the Live Activity is removed from the Lock Screen after ending. |

  

Ends the Live Activity.

Returns: `Promise<void>`

### `getPushToken()`

Supported platforms: iOS.

Returns the push token for this Live Activity, used to send push notification updates via APNs. Returns `null` if push notifications are not enabled or the token is not yet available.

Returns: `Promise<string>`

### `update(props)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `props` | `T` | The updated content properties. |

  

Updates the Live Activity's content. The UI reflects the new properties immediately.

Returns: `Promise<void>`

### `LiveActivityFactory`

Supported platforms: iOS.

Manages Live Activity instances of a specific type. Use it to start new activities and retrieve currently active ones.

LiveActivityFactory Methods

### `getInstances()`

Supported platforms: iOS.

Returns all currently active instances of this Live Activity type.

Returns: `LiveActivity[]`

### `start(props, url)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `props` | `T` | The initial content properties for the Live Activity. |
| `url`(optional) | `string` | An optional URL to associate with the Live Activity, used for deep linking. |

  

Starts a new Live Activity with the given properties.

Returns: `LiveActivity<t>`

The new Live Activity instance.

### `Widget`

Supported platforms: iOS.

Represents a widget instance. Provides methods to manage the widget's timeline.

Widget Methods

### `getTimeline()`

Supported platforms: iOS.

Returns the current timeline entries for the widget, including past and future entries.

Returns: `Promise<widgettimelineentry[]>`

### `reload()`

Supported platforms: iOS.

Force reloads the widget, causing it to refresh its content and timeline.

Returns: `void`

### `updateSnapshot(props)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `props` | `T` | The properties to display in the widget. |

  

Sets the widget's content to the given props immediately, without scheduling a timeline.

Returns: `void`

### `updateTimeline(entries)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `entries` | [WidgetTimelineEntry[]](#widgettimelineentry) | Timeline entries, each specifying a date and the props to display at that time. |

  

Schedules a series of updates for the widget's content and reloads the widget.

Returns: `void`

## Methods

### `createLiveActivity(name, liveActivity)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The Live Activity name. Must match the `'name'` field in your widget configuration in the app config. |
| `liveActivity` | [LiveActivityComponent](#liveactivitycomponent)<T\> | The Live Activity component, marked with the `'widget'` directive. |

  

Creates a Live Activity Factory for managing Live Activities of a specific type.

Returns: `LiveActivityFactory<t>`

### `createWidget(name, widget)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The widget name. Must match the `'name'` field in your widget configuration in the app config. |
| `widget` | (props: [WidgetBase](#widgetbase)<T\>) => [Element](https://www.typescriptlang.org/docs/handbook/jsx.html#function-component) | The widget component, marked with the `'widget'` directive. |

  

Creates a Widget instance.

Returns: `Widget<t>`

## Event Subscriptions

### `addPushToStartTokenListener(listener)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `listener` | (event: [PushToStartTokenEvent](#pushtostarttokenevent)) => void | Callback function to handle push-to-start token events. |

  

Adds a listener for push-to-start token events. This token can be used to start live activities remotely via APNs.

Returns: `EventSubscription`

An event subscription that can be used to remove the listener.

### `addUserInteractionListener(listener)`

Supported platforms: iOS.

| Parameter | Type | Description |
| --- | --- | --- |
| `listener` | (event: [UserInteractionEvent](#userinteractionevent)) => void | Callback function to handle user interaction events. |

  

Adds a listener for widget interaction events (for example, button taps).

Returns: `EventSubscription`

An event subscription that can be used to remove the listener.

## Types

### `ExpoWidgetsEvents`

Supported platforms: iOS.

| Property | Type | Description |
| --- | --- | --- |
| onExpoWidgetsPushToStartTokenReceived | (event: [PushToStartTokenEvent](#pushtostarttokenevent)) => void | Function that is invoked when a push-to-start token is received. event: [PushToStartTokenEvent](#pushtostarttokenevent). Token event details. |
| onExpoWidgetsUserInteraction | (event: [UserInteractionEvent](#userinteractionevent)) => void | Function that is invoked when user interacts with a widget. event: [UserInteractionEvent](#userinteractionevent). Interaction event details. |

### `LiveActivityComponent(props)`

Supported platforms: iOS.

A function that returns the layout for a Live Activity.

| Parameter | Type |
| --- | --- |
| `props`(optional) | `T` |

Returns:

[LiveActivityLayout](#liveactivitylayout)

### `LiveActivityDismissalPolicy`

Supported platforms: iOS.

Literal Type: `string`

Dismissal policy for ending a live activity.

Acceptable values are: `'default'` | `'immediate'`

### `LiveActivityEvents`

Supported platforms: iOS.

| Property | Type | Description |
| --- | --- | --- |
| onExpoWidgetsTokenReceived | (event: [PushTokenEvent](#pushtokenevent)) => void | Function that is invoked when a push token is received for a live activity. event: [PushTokenEvent](#pushtokenevent). Token event details. |

### `LiveActivityLayout`

Supported platforms: iOS.

Defines the layout sections for an iOS Live Activity.

| Property | Type | Description |
| --- | --- | --- |
| banner | [ReactNode](https://reactnative.dev/docs/react-node) | The main banner content displayed in Notifications Center. |
| bannerSmall(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The small banner content displayed in CarPlay and WatchOS. Falls back to `banner` if not provided. |
| compactLeading(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The leading content in the compact Dynamic Island presentation. |
| compactTrailing(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The trailing content in the compact Dynamic Island presentation. |
| expandedBottom(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The bottom content in the expanded Dynamic Island presentation. |
| expandedCenter(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The center content in the expanded Dynamic Island presentation. |
| expandedLeading(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The leading content in the expanded Dynamic Island presentation. |
| expandedTrailing(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The trailing content in the expanded Dynamic Island presentation. |
| minimal(optional) | [ReactNode](https://reactnative.dev/docs/react-node) | The minimal content shown when the Dynamic Island is in its smallest form. |

### `PushTokenEvent`

Supported platforms: iOS.

Event emitted when a push token is received for a live activity.

| Property | Type | Description |
| --- | --- | --- |
| activityId | `string` | The ID of the live activity. |
| pushToken | `string` | The push token for the live activity. |

### `PushToStartTokenEvent`

Supported platforms: iOS.

Event emitted when a push-to-start token is received.

| Property | Type | Description |
| --- | --- | --- |
| activityPushToStartToken | `string` | The push-to-start token for starting live activities remotely. |

### `UserInteractionEvent`

Supported platforms: iOS.

Event emitted when a user interacts with a widget.

| Property | Type | Description |
| --- | --- | --- |
| source | `string` | Widget that triggered the interaction. |
| target | `string` | Button/toggle that was pressed. |
| timestamp | `number` | Timestamp of the event. |
| type | `'ExpoWidgetsUserInteraction'` | The event type identifier. |

### `WidgetBase`

Supported platforms: iOS.

Props passed to a widget component.

Type: `T` extended by:

| Property | Type | Description |
| --- | --- | --- |
| date | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | The date of this timeline entry. |
| family | [WidgetFamily](#widgetfamily) | The widget family. |

### `WidgetFamily`

Supported platforms: iOS.

Literal Type: `string`

The widget family (size).

-   `systemSmall` - Small square widget (2x2 grid).
-   `systemMedium` - Medium widget (4x2 grid).
-   `systemLarge` - Large widget (4x4 grid).
-   `systemExtraLarge` - Extra large widget (iPad only, 6x4 grid).
-   `accessoryCircular` - Circular accessory widget for the Lock Screen.
-   `accessoryRectangular` - Rectangular accessory widget for the Lock Screen.
-   `accessoryInline` - Inline accessory widget for the Lock Screen.

Acceptable values are: `'systemSmall'` | `'systemMedium'` | `'systemLarge'` | `'systemExtraLarge'` | `'accessoryCircular'` | `'accessoryRectangular'` | `'accessoryInline'`

### `WidgetTimelineEntry`

Supported platforms: iOS.

| Property | Type | Description |
| --- | --- | --- |
| date | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | Date when widget should update. |
| props | `T` | Props to be passed to the widget. |
