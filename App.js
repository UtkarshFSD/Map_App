import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
  Button,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';

const PowerSavingModeModule = NativeModules.BatteryStatusModule;

export default function App() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isChoosingSource, setIsChoosingSource] = useState(false);
  const [isChoosingDestination, setIsChoosingDestination] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [batteryOptimizationStatus, setBatteryOptimizationStatus] = useState(null);
  const mapRef = useRef(null);

  const defaultLocation = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setLocation(currentLocation);
        setLoading(false);
      },
      error => {
        Alert.alert(
          'Error',
          `Failed to get your location: ${error.message}` +
            ' Make sure your location is enabled.'
        );
        setLocation(defaultLocation);
        setLoading(false);
      }
    );
  };

  const checkBatteryOptimizationStatus = () => {
    if (PowerSavingModeModule && PowerSavingModeModule.getBatteryOptimizationStatus) {
      PowerSavingModeModule.getBatteryOptimizationStatus()
        .then(isEnabled => {
          setBatteryOptimizationStatus(isEnabled ? 'ON' : 'OFF');
        })
        .catch(error => {
          console.error('Failed to get battery optimization status:', error);
          setBatteryOptimizationStatus('Unknown');
        });
    } else {
      setBatteryOptimizationStatus('Unsupported');
    }
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            getCurrentLocation();
          } else {
            Alert.alert(
              'Permission Denied',
              'Location permission is required to show your current location on the map.'
            );
            setLocation(defaultLocation);
            setLoading(false);
          }
        } catch (err) {
          console.warn(err);
          setLocation(defaultLocation);
          setLoading(false);
        }
      } else {
        getCurrentLocation();
      }
    };

    requestLocationPermission();
    checkBatteryOptimizationStatus();

    const batteryStatusEmitter = new NativeEventEmitter(PowerSavingModeModule);
    const subscription = batteryStatusEmitter.addListener(
      'BatteryStatusChanged',
      isEnabled => {
        setBatteryOptimizationStatus(isEnabled ? 'ON' : 'OFF');
      }
    );

    const intervalId = setInterval(() => {
      setIsPopupVisible(true);
    }, 600000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const handleMapPress = e => {
    const coordinate = e.nativeEvent.coordinate;
    if (isChoosingSource) {
      setSource(coordinate);
      setIsChoosingSource(false);
    } else if (isChoosingDestination) {
      setDestination(coordinate);
      setIsChoosingDestination(false);
    }
  };

  const fetchRoute = async () => {
    if (source && destination) {
      try {
        const response = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
        );

        const coordinates = response.data.routes[0].geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coordinates);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch route.');
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (source && destination) {
      fetchRoute();
    }
  }, [source, destination]);

  const renderArrows = () => {
    const arrowInterval = Math.max(1, Math.floor(routeCoordinates.length / 10));
    return routeCoordinates.map((coord, index) => {
      if (index % arrowInterval === 0 && index < routeCoordinates.length - 1) {
        const nextCoord = routeCoordinates[index + 1];
        const rotationAngle =
          (Math.atan2(
            nextCoord.latitude - coord.latitude,
            nextCoord.longitude - coord.longitude
          ) *
            180) /
          Math.PI;

        return (
          <Marker
            key={index}
            coordinate={coord}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={rotationAngle}
          >
            <Image
              source={require('./assets/arrow.png')}
              style={{
                width: 40,
                height: 40,
                resizeMode: 'contain',
              }}
            />
          </Marker>
        );
      }
      return null;
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            region={location}
            onPress={handleMapPress}
          >
            {source && (
              <Marker
                coordinate={source}
                title={'Source'}
                description={'Your source location'}
                pinColor={'green'}
              />
            )}
            {destination && (
              <Marker
                coordinate={destination}
                title={'Destination'}
                description={'Your destination location'}
                pinColor={'blue'}
              />
            )}
            {routeCoordinates.length > 0 && (
              <>
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="red"
                  strokeWidth={3}
                />
                {renderArrows()}
              </>
            )}
          </MapView>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Battery Optimization Status</Text>
            <Text style={styles.cardText}>
              {batteryOptimizationStatus || 'Checking...'}
            </Text>
          </View>

          <Modal
            visible={isPopupVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.popupContainer}>
              <View style={styles.popup}>
                <Text style={styles.popupText}>
                  Updated Location:
                  {'\n'}Latitude: {location?.latitude?.toFixed(6)}
                  {'\n'}Longitude: {location?.longitude?.toFixed(6)}
                </Text>
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => setIsPopupVisible(false)}
                >
                  <Text style={styles.popupButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={styles.buttonContainer}>
            <Button
              title={isChoosingSource ? 'Select Source' : 'Set Source'}
              onPress={() => setIsChoosingSource(true)}
            />
            <Button
              title={isChoosingDestination ? 'Select Destination' : 'Set Destination'}
              onPress={() => setIsChoosingDestination(true)}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '90%',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  cardText: {
    fontSize: 16,
    color: '#000',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  popupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popup: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  popupText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  popupButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  popupButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
