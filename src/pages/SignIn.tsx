import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

export default function SignIn() {
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
          afterSignInUrl="/"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-lg',
            },
          }}
        />
      </div>
    </div>
  );
}
