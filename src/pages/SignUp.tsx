import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join Prela</h1>
          <p className="mt-2 text-gray-600">Start monitoring your AI agents today</p>
        </div>

        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
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
