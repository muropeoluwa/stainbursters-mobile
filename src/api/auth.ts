// src/api/auth.ts
import { BASE_URL } from './config';

// REGISTER FUNCTION
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: string
) => {
  try {
    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);

    const response = await fetch(`${BASE_URL}/register_user.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Register JSON Parse Error:', parseError);
      console.log('Raw register response:', text);
      return { status: false, message: 'Server returned invalid response' };
    }
  } catch (error) {
    console.error('Register error:', error);
    return { status: false, message: 'Network error' };
  }
};

// LOGIN FUNCTION
export const loginUser = async (
  email: string,
  password: string
) => {
  try {
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/login_user.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Login JSON Parse Error:', parseError);
      console.log('Raw login response:', text);
      return { status: false, message: 'Server returned invalid response' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { status: false, message: 'Network error' };
  }
};
