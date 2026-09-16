import { validateCredentials } from './validateCredentials';

describe('credential validation', () => {
  it('requires both fields', () => {
    expect(validateCredentials({ email: ' ', password: '' }, 'signUp')).toEqual(
      { email: 'Enter your email address.', password: 'Enter your password.' },
    );
  });
  it('rejects malformed email and a short registration password', () => {
    expect(
      validateCredentials({ email: 'hello@', password: 'short' }, 'signUp'),
    ).toEqual({
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
    });
  });
  it('accepts whitespace around email without trimming passwords', () => {
    expect(
      validateCredentials(
        { email: ' learner@example.com ', password: ' 123456 ' },
        'signUp',
      ),
    ).toEqual({});
  });
  it('does not apply new password rules to existing sign-ins', () => {
    expect(
      validateCredentials(
        { email: 'learner@example.com', password: 'old' },
        'signIn',
      ),
    ).toEqual({});
  });
});
