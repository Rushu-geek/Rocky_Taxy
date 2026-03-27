import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// iOS Simulator shares Mac's network — localhost works fine.
// Android emulator maps 10.0.2.2 → host localhost.
// Physical iPhone: replace localhost with your Mac's LAN IP (ipconfig getifaddr en0).
const BASE_URL =
  Platform.OS === 'android'
    ?
    // 'http://10.0.2.2:3000/api'
    'https://app.bullstreetedge.com/rocky-api/api'
    :
    // 'http://localhost:3000/api';
    'https://app.bullstreetedge.com/rocky-api/api'

export const TOKEN_KEY = '@taxi_app_token';
export const USER_KEY = '@taxi_app_user';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: clean error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);
