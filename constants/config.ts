import {
  API_URL,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  GEOAPIFY_API_KEY,
} from '@env';

// API Configuration
// For physical devices, use your computer's local IP address
// To find it: Run 'ipconfig' in terminal and look for IPv4 Address (usually starts with 192.168.x.x)
export const BASE_URL = API_URL || 'http://localhost:3000';
// For Android emulator, use: 'http://10.0.2.2:3000'

// Google OAuth Client IDs
// Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
export const googleAndroidClientId = GOOGLE_ANDROID_CLIENT_ID;
export const googleWebClientId = GOOGLE_WEB_CLIENT_ID;

// Static Maps API Key (Geoapify - free 3000 req/day)
// Get your free key at: https://www.geoapify.com/
export const geoapifyApiKey = GEOAPIFY_API_KEY;
