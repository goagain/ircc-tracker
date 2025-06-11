import { AxiosHeaders } from 'axios';
import Cookies from 'js-cookie';

class TokenService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly TOKEN_EXPIRY = 7; // 7 days

  setToken(token: string): void {
    console.log('Setting token in cookie');
    Cookies.set(TokenService.TOKEN_KEY, token, {
      expires: TokenService.TOKEN_EXPIRY,
      secure: true, // only send the cookie over HTTPS in production
      sameSite: 'strict', // prevent CSRF attacks
      path: '/', // available throughout the application
    });
    // verify token is successfully set
    const savedToken = this.getToken();
    console.log('Token after setting:', savedToken ? 'Token exists' : 'No token found');
  }

  getToken(): string | null {
    const token = Cookies.get(TokenService.TOKEN_KEY);
    console.log('Getting token from cookie:', token ? 'Token exists' : 'No token found');
    return token || null;
  }

  removeToken(): void {
    console.log('Removing token from cookie');
    Cookies.remove(TokenService.TOKEN_KEY, {
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
    // verify token is successfully removed
    const remainingToken = this.getToken();
    console.log('Token after removal:', remainingToken ? 'Token still exists' : 'Token removed');
  }

  getAuthHeader(): AxiosHeaders {
    const token = this.getToken();
    console.log('Getting auth header with token:', token ? 'Token exists' : 'No token found');
    const headers = new AxiosHeaders();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}

export default new TokenService();