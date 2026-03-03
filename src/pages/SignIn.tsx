import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export default function SignIn() {
  const location = useLocation();
  const isFactorTwo = location.pathname.includes('factor-two');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Prela</h1>
          <p className="mt-2 text-gray-600">Sign in to access your dashboard</p>
        </div>

        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-lg',
            },
          }}
        />

        {isFactorTwo && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-sm text-yellow-800">
              Having trouble with two-factor authentication?{' '}
              <a href="/sign-in" className="underline font-medium">
                Try signing in again
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
