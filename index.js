import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './App';
import widgetTaskHandler from './src/widgets/widget-task-handler';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Rejestruje handler widgetu na ekranie głównym (react-native-android-widget).
// Android woła go w tle (headless JS), gdy widget zostanie dodany/odświeżony/
// zmieni rozmiar — patrz src/widgets/widget-task-handler.js.
registerWidgetTaskHandler(widgetTaskHandler);
