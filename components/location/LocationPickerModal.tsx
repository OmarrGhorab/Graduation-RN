import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: {
        name: string;
        latitude: number;
        longitude: number;
    }) => void;
}

export default function LocationPickerModal({
    visible,
    onClose,
    onSelectLocation,
}: LocationPickerModalProps) {
    const { theme, isDark } = useTheme();
    const [locationName, setLocationName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const handleGetCurrentLocation = async () => {
        try {
            setIsGettingLocation(true);

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to get your current location');
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setLatitude(location.coords.latitude.toFixed(6));
            setLongitude(location.coords.longitude.toFixed(6));

            // Try to get address
            try {
                const addresses = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (addresses.length > 0) {
                    const address = addresses[0];
                    const addressParts = [
                        address.name,
                        address.street,
                        address.city,
                    ].filter(Boolean);
                    setLocationName(addressParts.join(', '));
                }
            } catch (error) {
                console.log('Could not get address:', error);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to get current location');
            console.error(error);
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleConfirm = () => {
        if (!locationName.trim()) {
            Alert.alert('Validation Error', 'Please enter a location name');
            return;
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Validation Error', 'Please enter valid coordinates');
            return;
        }

        if (lat < -90 || lat > 90) {
            Alert.alert('Validation Error', 'Latitude must be between -90 and 90');
            return;
        }

        if (lng < -180 || lng > 180) {
            Alert.alert('Validation Error', 'Longitude must be between -180 and 180');
            return;
        }

        onSelectLocation({
            name: locationName.trim(),
            latitude: lat,
            longitude: lng,
        });

        // Reset form
        setLocationName('');
        setLatitude('');
        setLongitude('');
        onClose();
    };

    const handleCancel = () => {
        setLocationName('');
        setLatitude('');
        setLongitude('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={handleCancel}
                />

                <View style={[styles.modalContent, {
                    backgroundColor: isDark ? '#183327' : '#ffffff'
                }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, {
                            color: isDark ? '#ffffff' : '#0d1b15'
                        }]}>
                            Select Location
                        </Text>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={isDark ? '#e1e5e9' : '#696f77'} />
                        </TouchableOpacity>
                    </View>

                    {/* Current Location Button */}
                    <TouchableOpacity
                        style={[styles.currentLocationButton, {
                            backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee',
                            borderColor: cskColors[500],
                        }]}
                        onPress={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                    >
                        {isGettingLocation ? (
                            <ActivityIndicator size="small" color={cskColors[500]} />
                        ) : (
                            <>
                                <Ionicons name="locate" size={20} color={cskColors[500]} />
                                <Text style={[styles.currentLocationText, {
                                    color: cskColors[500]
                                }]}>
                                    Use Current Location
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, {
                            backgroundColor: isDark ? '#2a4d3d' : '#e9ebed'
                        }]} />
                        <Text style={[styles.dividerText, {
                            color: isDark ? '#a8b0b8' : '#696f77'
                        }]}>
                            or enter manually
                        </Text>
                        <View style={[styles.dividerLine, {
                            backgroundColor: isDark ? '#2a4d3d' : '#e9ebed'
                        }]} />
                    </View>

                    {/* Location Name Input */}
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

                    {/* Coordinates */}
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, styles.flex1]}>
                            <Text style={[styles.label, {
                                color: isDark ? '#e1e5e9' : '#0d1b15'
                            }]}>
                                Latitude
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="30.0444"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={latitude}
                                onChangeText={setLatitude}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputContainer, styles.flex1]}>
                            <Text style={[styles.label, {
                                color: isDark ? '#e1e5e9' : '#0d1b15'
                            }]}>
                                Longitude
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="31.2357"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={longitude}
                                onChangeText={setLongitude}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Info Text */}
                    <View style={[styles.infoBox, {
                        backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee',
                    }]}>
                        <Ionicons name="information-circle" size={16} color={cskColors[500]} />
                        <Text style={[styles.infoText, {
                            color: isDark ? '#e1e5e9' : '#0d1b15'
                        }]}>
                            You can get coordinates from Google Maps by right-clicking on a location
                        </Text>
                    </View>

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
                                backgroundColor: cskColors[500]
                            }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    closeButton: {
        padding: 4,
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 20,
    },
    currentLocationText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
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
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    flex1: {
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        fontFamily: Fonts.regular,
        lineHeight: 16,
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
