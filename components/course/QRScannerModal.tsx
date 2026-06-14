
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
// Scanner frame: 70% of width but capped so it never overflows on tall or short screens
const SCANNER_SIZE = Math.min(width * 0.7, height * 0.42);

interface QRScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

export default function QRScannerModal({ visible, onClose, onScan }: QRScannerModalProps) {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
        if (visible) {
            setScanned(false);
        }
    }, [visible, permission]);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        onScan(data);
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <Text style={[styles.text, { color: theme.text }]}>No access to camera</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.button}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={[styles.closeButton, { top: insets.top + 16 }]}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* Overlay */}
                <View style={[styles.overlay, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButtonCircle}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.overlayTitle}>Scan QR Code</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Scanner frame */}
                    <View style={styles.scannerContainer}>
                        <View style={styles.scannerFrame}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <View style={styles.scanLine} />
                    </View>

                    {/* Footer hint */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Align the QR code within the frame to mark attendance</Text>
                        {scanned && (
                            <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanButton}>
                                <Ionicons name="refresh" size={16} color={cskColors[500]} />
                                <Text style={styles.rescanText}>Tap to scan again</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    closeButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTitle: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    scannerContainer: {
        alignSelf: 'center',
        width: SCANNER_SIZE,
        height: SCANNER_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderColor: cskColors[500],
        borderWidth: 4,
    },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    scanLine: {
        position: 'absolute',
        width: '90%',
        height: 2,
        backgroundColor: 'rgba(18, 237, 135, 0.8)',
        top: '50%',
        shadowColor: cskColors[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    footer: {
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    footerText: {
        color: '#FFF',
        textAlign: 'center',
        fontFamily: Fonts.medium,
        fontSize: 14,
        opacity: 0.8,
    },
    rescanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: cskColors[500],
    },
    rescanText: {
        color: cskColors[500],
        fontFamily: Fonts.semiBold,
        fontSize: 14,
    },
    text: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginBottom: 20,
    },
    button: {
        backgroundColor: cskColors[500],
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: Fonts.bold,
        color: '#000',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
    },
});
