import { isFirebaseConfigured } from './firebaseConfig';

const configured = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  appId: 'test-app-id',
};

test('accepts auth configuration without optional storage or messaging values', () => {
  expect(isFirebaseConfigured(configured)).toBe(true);
});

test('keeps account setup pending when no environment values are supplied', () => {
  expect(isFirebaseConfigured({})).toBe(false);
});

test.each(['apiKey', 'authDomain', 'projectId', 'appId'] as const)(
  'rejects a missing or blank %s before starting authentication',
  key => {
    for (const value of [undefined, '', '   ']) {
      expect(isFirebaseConfigured({ ...configured, [key]: value })).toBe(false);
    }
  },
);
