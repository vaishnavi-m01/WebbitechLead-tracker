import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../.env';
import * as NavigationService from '../navigation/NavigationService';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';


let cachedToken: string | null = null;


export const setAuthToken = async (token: string | null) => {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

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


export const clearAuthSession = async () => {
  await setAuthToken(null);
  await AsyncStorage.removeItem(USER_KEY);
};

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


api.interceptors.request.use(async (config) => {
  const token = cachedToken !== null ? cachedToken : await loadAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorMessage = 'Something went wrong. Please try again later.';

    if (error.response) {
    
      const status = error.response.status;

    
      if (status === 401 && !error.config?.url?.includes('/login')) {
        clearAuthSession();
        
        setTimeout(() => {
          NavigationService.reset('Login');
        }, 100);
      }

      switch (status) {
        case 400:
          errorMessage = 'Bad Request. Please check the data you have submitted.';
          break;
        case 401:
          errorMessage = error.response?.data?.message || 'Unauthorized. Please login again.';
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
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else {
      errorMessage = error.message;
    }

    console.error('API Error:', error.response?.status || 'No Status', error.response?.data || error.message);
    
    const isSearchEndpoint = error.config?.url?.includes('/search');
    const isNotFound = error.response?.status === 404;
    const errStatus = error.response?.status;
    
    if (!(isSearchEndpoint && isNotFound) && errStatus !== 401) {
      Alert.alert('Error', errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
