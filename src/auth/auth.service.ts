import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signup(email: string, password: string, role: string) {
    return {
      message: 'User registered successfully',
      email,
      role,
    };
  }

  login(email: string, password: string) {
    return {
      message: 'Login successful',
      token: 'dummy-jwt-token',
    };
  }
}