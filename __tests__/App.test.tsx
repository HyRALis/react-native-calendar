/**
 * @format
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

jest.mock('../src/features/auth/services/firebaseAuthService', () => ({
  getFirebaseAuthService: jest.fn(),
}));

jest.mock('../src/config/firebaseConfig', () => ({
  firebaseConfig: {},
  isFirebaseConfigured: () => false,
}));

test('explains missing account setup without crashing or granting access', () => {
  render(<App />);
  expect(screen.getByText('Account setup is pending')).toBeOnTheScreen();
  expect(screen.queryByText('Your calendar')).toBeNull();
});
