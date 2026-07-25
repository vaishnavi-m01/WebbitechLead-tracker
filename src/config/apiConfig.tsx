import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../.env';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// In-memory cache so we don't have to `await AsyncStorage.getItem` on every
// single outgoing request — only the very first request after app launch
// pays the AsyncStorage read cost, everything after that reads from memory.
let cachedToken: string | null = null;

/**
 * Call this right after a successful login (with the token) and right
 * before logout (with null) to keep memory + AsyncStorage in sync.
 */
export const setAuthToken = async (token: string | null) => {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

/** Reads the token from memory if we already have it, else from disk. */
export const loadAuthToken = async () => {
  if (cachedToken === null) {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  }
  return cachedToken;
};

export const setStoredUser = async (user: unknown) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = async <T,>(): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
};

/** Clears everything on logout / forced sign-out (e.g. 401 from the server). */
export const clearAuthSession = async () => {
  await setAuthToken(null);
  await AsyncStorage.removeItem(USER_KEY);
};

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach `Authorization: Bearer <token>` to every
// outgoing request automatically, once we have a token stored.
api.interceptors.request.use(async (config) => {
  const token = cachedToken !== null ? cachedToken : await loadAuthToken();
  console.log("Attached Auth Token from local storage:", token);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorMessage = 'Something went wrong. Please try again later.';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;

      // Token expired / invalid — clear the stored session so the app
      // doesn't keep firing requests with a dead token.
      if (status === 401) {
        clearAuthSession();
      }

      switch (status) {
        case 400:
          errorMessage = 'Bad Request. Please check the data you have submitted.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission for this action.';
          break;
        case 404:
          errorMessage = 'Resource not found. The requested data does not exist.';
          break;
        case 408:
          errorMessage = 'Request Timeout. Please check your internet connection.';
          break;
        case 422:
          errorMessage = 'Validation Error. Please check your input fields.';
          break;
        case 500:
          errorMessage = 'Internal Server Error. Our team has been notified. Please try again later.';
          break;
        case 502:
          errorMessage = 'Bad Gateway. The server is temporarily unavailable.';
          break;
        case 503:
          errorMessage = 'Service Unavailable. Please try again later.';
          break;
        case 504:
          errorMessage = 'Gateway Timeout. The server took too long to respond.';
          break;
        default:
          if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = `Unexpected Error: ${status}`;
          }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }

    console.error('API Error:', error.response?.status || 'No Status', error.response?.data || error.message);
    Alert.alert('Error', errorMessage);

    return Promise.reject(error);
  }
);

export default api;
