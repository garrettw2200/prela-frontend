import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { acceptInvitation } from '../api/teams';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { refreshTeams } = useTeam();
  const [accepted, setAccepted] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(token!),
    onSuccess: () => {
      setAccepted(true);
      refreshTeams();
      // Navigate to team settings after a brief delay
      setTimeout(() => navigate('/team'), 2000);
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Invalid Invitation</h2>
          <p className="mt-2 text-sm text-gray-500">This invitation link is invalid.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store token and redirect to sign-in
    localStorage.setItem('prela_pending_invite', token);
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Sign in to Accept</h2>
          <p className="mt-2 text-sm text-gray-500">
            Please sign in or create an account to accept this invitation.
          </p>
          <a
            href="/sign-in"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Invitation Accepted</h2>
          <p className="mt-2 text-sm text-gray-500">
            Redirecting to team settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow text-center">
        <h2 className="text-xl font-semibold text-gray-900">Team Invitation</h2>
        <p className="mt-2 text-sm text-gray-500">
          You've been invited to join a team on Prela.
        </p>

        {acceptMutation.isError && (
          <div className="mt-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">
              {(acceptMutation.error as Error)?.message || 'Failed to accept invitation. It may have expired or already been accepted.'}
            </p>
          </div>
        )}

        <button
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
          className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {acceptMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
        </button>
      </div>
    </div>
  );
}
