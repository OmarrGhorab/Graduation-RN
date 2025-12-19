// API Configuration
// For physical devices, use your computer's local IP address
// To find it: Run 'ipconfig' in terminal and look for IPv4 Address (usually starts with 192.168.x.x)
export const BASE_URL = 'http://192.168.1.13:3000'; // Your computer's local IP address
// For Android emulator, use: 'http://10.0.2.2:3000'

// Google OAuth Client IDs
// Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
export const GOOGLE_ANDROID_CLIENT_ID = '564438837664-o3jciigqr956a73jtu4l6fg7kgrh78md.apps.googleusercontent.com'; // TODO: Replace with actual Android client ID
export const GOOGLE_WEB_CLIENT_ID = '564438837664-tcv289cukv6pvmmhgr4n7kki8mj8t3pf.apps.googleusercontent.com'; // TODO: Replace with actual Web client ID (required for ID token)
