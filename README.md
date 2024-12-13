# MapApp

## Overview
MapApp is a React Native application that integrates Google Maps and provides functionalities like location tracking, route drawing, and monitoring battery optimization. The app includes several features to enhance user experience and demonstrate native module integration.

## Features

1. **Google Map Integration**:
   - Displays a map using `react-native-maps`.
   - Allows users to set source and destination points by tapping on the map.
   - Draws a route (polyline) between the source and destination.

2. **Automatic Location Updates**:
   - Updates the user's current location every 10 minutes using `@react-native-community/geolocation`.
   - A popup appears every 10 minutes showing the updated latitude and longitude.

3. **Source-to-Destination Distance**:
   - Calculates and displays the distance between the source and destination points.
   - Shows arrows along the route to indicate direction, though alignment requires improvement.

4. **Battery Optimization Status**:
   - Integrates a native module to check the device's battery optimization (power-saving) status.
   - Displays a card showing whether battery optimization is enabled or disabled.
   - Dynamically updates when the battery optimization status changes.

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/UtkarshFSD/MapApp.git
   cd MapApp
