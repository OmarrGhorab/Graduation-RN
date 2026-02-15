import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DeviceService } from '@/services/DeviceService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: {
        name: string;
        latitude: number;
        longitude: number;
    }) => void;
    initialGeofenceRadius?: number;
    onGeofenceRadiusChange?: (radius: number) => void;
}

export default function LocationPickerModal({
    visible,
    onClose,
    onSelectLocation,
    initialGeofenceRadius = 50,
    onGeofenceRadiusChange,
}: LocationPickerModalProps) {
    const { theme, isDark } = useTheme();
    const webViewRef = useRef<WebView>(null);
    
    const [locationName, setLocationName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [geofenceRadius, setGeofenceRadius] = useState(initialGeofenceRadius);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    // Auto-fetch current location when modal opens
    useEffect(() => {
        if (visible && !selectedLocation) {
            // Don't auto-fetch, let user choose
            setMapReady(false);
        }
    }, [visible]);

    const handleGetCurrentLocation = async () => {
        try {
            setIsGettingLocation(true);

            const location = await DeviceService.getPreciseLocation({ 
                accuracy: 'high',
                includeGeocoding: true,
                forceRefresh: true
            });

            if (location) {
                const newLocation = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                };
                
                setSelectedLocation(newLocation);
                
                // Auto-fill location name if not set
                if (!locationName) {
                    const suggestedName = location.street || location.city || 'Selected Location';
                    setLocationName(suggestedName);
                }

                // Update map
                if (webViewRef.current && mapReady) {
                    webViewRef.current.injectJavaScript(`
                        updateLocation(${location.latitude}, ${location.longitude}, ${geofenceRadius});
                        true;
                    `);
                }
            } else {
                Alert.alert(
                    'Location Access Required',
                    'Please enable location services to use the map.'
                );
            }
        } catch (error) {
            console.error('Location error:', error);
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'mapReady') {
                setMapReady(true);
                if (selectedLocation) {
                    webViewRef.current?.injectJavaScript(`
                        updateLocation(${selectedLocation.latitude}, ${selectedLocation.longitude}, ${geofenceRadius});
                        true;
                    `);
                }
            } else if (data.type === 'locationSelected') {
                setSelectedLocation({
                    latitude: data.latitude,
                    longitude: data.longitude,
                });
                
                // Clear location name so user can enter a new one
                if (locationName) {
                    setLocationName('');
                }
            }
        } catch (error) {
            console.error('Map message error:', error);
        }
    };

    const handleConfirm = () => {
        if (!locationName.trim()) {
            Alert.alert('Validation Error', 'Please enter a location name');
            return;
        }

        if (!selectedLocation) {
            Alert.alert('Validation Error', 'Please select a location on the map');
            return;
        }

        onSelectLocation({
            name: locationName.trim(),
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
        });

        // Notify parent about geofence radius change
        if (onGeofenceRadiusChange && geofenceRadius !== initialGeofenceRadius) {
            onGeofenceRadiusChange(geofenceRadius);
        }

        // Reset form
        resetForm();
        onClose();
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setLocationName('');
        setSelectedLocation(null);
        setGeofenceRadius(initialGeofenceRadius);
        setMapReady(false);
    };

    const handleRadiusChange = (value: number) => {
        setGeofenceRadius(value);
        if (webViewRef.current && selectedLocation) {
            webViewRef.current.injectJavaScript(`
                updateRadius(${value});
                true;
            `);
        }
    };

    const mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
        .leaflet-container { background: ${isDark ? '#1a1a1a' : '#f0f0f0'}; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map, marker, circle;
        let currentRadius = ${geofenceRadius};
        
        // Initialize map
        map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([30.0444, 31.2357], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);
        
        // Custom marker icon
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: ${cskColors[500]}; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        function updateLocation(lat, lng, radius) {
            currentRadius = radius;
            
            // Remove existing marker and circle
            if (marker) map.removeLayer(marker);
            if (circle) map.removeLayer(circle);
            
            // Add new marker
            marker = L.marker([lat, lng], { 
                icon: markerIcon,
                draggable: true 
            }).addTo(map);
            
            // Add circle
            circle = L.circle([lat, lng], {
                radius: radius,
                color: '${cskColors[500]}',
                fillColor: '${cskColors[500]}',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(map);
            
            // Center map
            map.setView([lat, lng], 16);
            
            // Handle marker drag
            marker.on('dragend', function(e) {
                const pos = e.target.getLatLng();
                circle.setLatLng(pos);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationSelected',
                    latitude: pos.lat,
                    longitude: pos.lng
                }));
            });
        }
        
        function updateRadius(radius) {
            currentRadius = radius;
            if (circle && marker) {
                circle.setRadius(radius);
            }
        }
        
        // Handle map clicks
        map.on('click', function(e) {
            updateLocation(e.latlng.lat, e.latlng.lng, currentRadius);
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            }));
        });
        
        // Notify React Native that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
        }));
    </script>
</body>
</html>
    `;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleCancel}
        >
            <View style={styles.modalContainer}>
                {/* Header */}
                <View style={[styles.header, {
                    backgroundColor: isDark ? '#183327' : '#ffffff',
                    borderBottomColor: isDark ? '#2a4d3d' : '#e9ebed'
                }]}>
                    <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color={isDark ? '#e1e5e9' : '#0d1b15'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: isDark ? '#ffffff' : '#0d1b15'
                    }]}>
                        Select Location
                    </Text>
                    <TouchableOpacity 
                        onPress={handleGetCurrentLocation}
                        style={styles.headerButton}
                        disabled={isGettingLocation}
                    >
                        {isGettingLocation ? (
                            <ActivityIndicator size="small" color={cskColors[500]} />
                        ) : (
                            <Ionicons name="locate" size={24} color={cskColors[500]} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{ html: mapHTML }}
                        style={styles.webView}
                        onMessage={handleMapMessage}
                        javaScriptEnabled
                        domStorageEnabled
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={cskColors[500]} />
                                <Text style={[styles.loadingText, {
                                    color: isDark ? '#e1e5e9' : '#0d1b15'
                                }]}>
                                    Loading map...
                                </Text>
                            </View>
                        )}
                    />

                    {/* Instructions Overlay */}
                    {!selectedLocation && mapReady && (
                        <View style={[styles.instructionsOverlay, {
                            backgroundColor: isDark ? 'rgba(24, 51, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)'
                        }]}>
                            <Ionicons name="location" size={48} color={cskColors[500]} />
                            <Text style={[styles.instructionsTitle, {
                                color: isDark ? '#ffffff' : '#0d1b15'
                            }]}>
                                Select a Location
                            </Text>
                            <Text style={[styles.instructionsText, {
                                color: isDark ? '#a8b0b8' : '#696f77'
                            }]}>
                                Tap anywhere on the map or use your current location
                            </Text>
                            <TouchableOpacity
                                style={[styles.currentLocationButton, {
                                    backgroundColor: cskColors[500]
                                }]}
                                onPress={handleGetCurrentLocation}
                                disabled={isGettingLocation}
                            >
                                {isGettingLocation ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <>
                                        <Ionicons name="navigate" size={20} color="#ffffff" />
                                        <Text style={styles.currentLocationButtonText}>
                                            Use Current Location
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bottom Sheet */}
                <View style={[styles.bottomSheet, {
                    backgroundColor: isDark ? '#183327' : '#ffffff'
                }]}>
                    {/* Geofence Radius Slider */}
                    {selectedLocation && (
                        <View style={styles.radiusSection}>
                            <View style={styles.radiusHeader}>
                                <View>
                                    <Text style={[styles.radiusLabel, {
                                        color: isDark ? '#e1e5e9' : '#0d1b15'
                                    }]}>
                                        Geofence Radius
                                    </Text>
                                    <Text style={[styles.radiusHelper, {
                                        color: isDark ? '#a8b0b8' : '#696f77'
                                    }]}>
                                        Students must be within this area
                                    </Text>
                                </View>
                                <View style={[styles.radiusBadge, {
                                    backgroundColor: cskColors[500]
                                }]}>
                                    <Text style={styles.radiusValue}>{geofenceRadius}m</Text>
                                </View>
                            </View>
                            
                            {/* Slider with better touch handling */}
                            <View style={styles.sliderWrapper}>
                                <View style={styles.sliderContainer}>
                                    <Text style={[styles.sliderLabel, {
                                        color: isDark ? '#a8b0b8' : '#696f77'
                                    }]}>
                                        10m
                                    </Text>
                                    <View style={styles.sliderTrack}>
                                        <View style={[styles.sliderTrackBg, {
                                            backgroundColor: isDark ? '#2a4d3d' : '#d1d5d9'
                                        }]} />
                                        <View style={[styles.sliderTrackFill, {
                                            width: `${((geofenceRadius - 10) / 190) * 100}%`,
                                            backgroundColor: cskColors[500]
                                        }]} />
                                        <View
                                            style={[styles.sliderThumb, {
                                                left: `${((geofenceRadius - 10) / 190) * 100}%`,
                                                backgroundColor: cskColors[500]
                                            }]}
                                        />
                                    </View>
                                    <Text style={[styles.sliderLabel, {
                                        color: isDark ? '#a8b0b8' : '#696f77'
                                    }]}>
                                        200m
                                    </Text>
                                </View>

                                {/* Touch overlay for better interaction */}
                                <View 
                                    style={styles.sliderTouchArea}
                                    onStartShouldSetResponder={() => true}
                                    onMoveShouldSetResponder={() => true}
                                    onResponderGrant={(e) => {
                                        const { locationX } = e.nativeEvent;
                                        const sliderWidth = 250;
                                        const percentage = Math.max(0, Math.min(1, (locationX - 35) / sliderWidth));
                                        const newRadius = Math.round((10 + (percentage * 190)) / 10) * 10;
                                        handleRadiusChange(Math.max(10, Math.min(200, newRadius)));
                                    }}
                                    onResponderMove={(e) => {
                                        const { locationX } = e.nativeEvent;
                                        const sliderWidth = 250;
                                        const percentage = Math.max(0, Math.min(1, (locationX - 35) / sliderWidth));
                                        const newRadius = Math.round((10 + (percentage * 190)) / 10) * 10;
                                        handleRadiusChange(Math.max(10, Math.min(200, newRadius)));
                                    }}
                                />
                            </View>

                            {/* Quick select buttons */}
                            <View style={styles.quickSelectContainer}>
                                {[25, 50, 100, 150].map((radius) => (
                                    <TouchableOpacity
                                        key={radius}
                                        style={[styles.quickSelectButton, {
                                            backgroundColor: geofenceRadius === radius 
                                                ? cskColors[500] 
                                                : (isDark ? '#1e1e1e' : '#f7f8f9'),
                                            borderColor: geofenceRadius === radius 
                                                ? cskColors[500] 
                                                : (isDark ? '#3a4048' : '#d1d5d9'),
                                        }]}
                                        onPress={() => handleRadiusChange(radius)}
                                    >
                                        <Text style={[styles.quickSelectText, {
                                            color: geofenceRadius === radius 
                                                ? '#ffffff' 
                                                : (isDark ? '#e1e5e9' : '#0d1b15')
                                        }]}>
                                            {radius}m
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Location Name Input */}
                    {selectedLocation && (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, {
                                color: isDark ? '#e1e5e9' : '#0d1b15'
                            }]}>
                                Location Name
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="e.g., Main Campus Building A"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={locationName}
                                onChangeText={setLocationName}
                            />
                        </View>
                    )}

                    {/* Coordinates Display */}
                    {selectedLocation && (
                        <View style={[styles.coordinatesBox, {
                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9'
                        }]}>
                            <Ionicons name="navigate" size={14} color={cskColors[500]} />
                            <Text style={[styles.coordinatesText, {
                                color: isDark ? '#a8b0b8' : '#696f77'
                            }]}>
                                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, {
                                backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                            }]}
                            onPress={handleCancel}
                        >
                            <Text style={[styles.cancelButtonText, {
                                color: isDark ? '#e1e5e9' : '#0d1b15'
                            }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, {
                                backgroundColor: selectedLocation ? cskColors[500] : (isDark ? '#2a4d3d' : '#d1d5d9'),
                            }]}
                            onPress={handleConfirm}
                            disabled={!selectedLocation}
                        >
                            <Text style={[styles.confirmButtonText, {
                                opacity: selectedLocation ? 1 : 0.5
                            }]}>
                                Confirm Location
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    instructionsOverlay: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: [{ translateX: -150 }, { translateY: -100 }],
        width: 300,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    instructionsTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        textAlign: 'center',
    },
    instructionsText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 18,
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    currentLocationButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    bottomSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    radiusSection: {
        marginBottom: 20,
    },
    radiusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    radiusLabel: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    radiusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    radiusValue: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    sliderWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sliderLabel: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        width: 35,
        textAlign: 'center',
    },
    sliderTrack: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        position: 'relative',
    },
    sliderTrackBg: {
        height: 6,
        borderRadius: 3,
    },
    sliderTrackFill: {
        position: 'absolute',
        height: 6,
        borderRadius: 3,
    },
    sliderThumb: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        marginLeft: -14,
        borderWidth: 3,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sliderTouchArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        zIndex: 10,
    },
    quickSelectContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    quickSelectButton: {
        flex: 1,
        height: 36,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickSelectText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
    },
    radiusHelper: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        lineHeight: 14,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        fontFamily: Fonts.regular,
    },
    coordinatesBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    coordinatesText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
    },
    confirmButton: {
    },
    cancelButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    confirmButtonText: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        color: '#ffffff',
    },
});
