import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const SERVER_URL_KEY = 'serverUrl';
const API_TOKEN_KEY = 'apiToken';
const USER_DATA_KEY = 'userData';
let serverUrl = 'http://192.168.254.104:8000/api';

export const getServerUrl = async (): Promise<string> => {
  const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
  if (saved) {
    serverUrl = saved;
  }
  return serverUrl;
};

export const setServerUrl = async (url: string): Promise<void> => {
  serverUrl = url;
  await AsyncStorage.setItem(SERVER_URL_KEY, url);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(API_TOKEN_KEY);
};

export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(API_TOKEN_KEY, token);
};

export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(API_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_DATA_KEY);
};

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- User Data Persistence ---

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const saveUserData = async (user: UserData): Promise<void> => {
  await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

export const getUserData = async (): Promise<UserData | null> => {
  const data = await AsyncStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

// --- API Calls ---

export const login = async (email: string, password: string): Promise<any> => {
  const url = await getServerUrl();
  try {
    const response = await axios.post(
      `${url}/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (response.data?.token) {
      await setAuthToken(response.data.token);
      // Save user data if returned
      if (response.data?.user) {
        await saveUserData(response.data.user);
      }
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error)) {
      return error.response?.data || { message: 'Unable to log in' };
    }
    return { message: 'Unable to log in' };
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  password_confirmation: string
): Promise<any> => {
  const url = await getServerUrl();
  try {
    const response = await axios.post(
      `${url}/register`,
      { name, email, password, password_confirmation },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    if (response.data?.token) {
      await setAuthToken(response.data.token);
      // Save user data if returned
      if (response.data?.user) {
        await saveUserData(response.data.user);
      }
    }

    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    if (axios.isAxiosError(error)) {
      return error.response?.data || { message: 'Unable to register' };
    }
    return { message: 'Unable to register' };
  }
};

export const fetchUserProfile = async (): Promise<UserData | null> => {
  const url = await getServerUrl();
  const headers = await getAuthHeaders();
  try {
    const response = await axios.get(`${url}/profile`, {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });

    const userData = response.data;
    if (userData?.id) {
      await saveUserData(userData);
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

export const getLatestSensorData = async (): Promise<any> => {
  const url = await getServerUrl();
  try {
    // Use combined endpoint for fewer API calls
    const response = await axios.get(`${url}/mobile/dashboard`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return null;
  }
};

export const getActuatorStatus = async (): Promise<any> => {
  const url = await getServerUrl();
  try {
    const response = await axios.get(`${url}/actuators/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching actuator status:', error);
    return null;
  }
};

export const controlActuator = async (actuator: string, state: boolean): Promise<any> => {
  const url = await getServerUrl();
  const headers = await getAuthHeaders();

  console.log(`📤 Sending to: ${url}/actuators/control`);
  console.log(`📦 Payload:`, { actuator, state, source: 'mobile' });
  
  try {
    const response = await axios.post(`${url}/actuators/control`, {
      actuator: actuator,
      state: state,
      source: 'mobile'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    });
    console.log('✅ Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Status code:', error.response?.status);
    }
    return null;
  }
};

// Buzzer duration is fixed at 4 seconds by Arduino hardware - no API endpoints needed
