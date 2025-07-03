"use client";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-12 max-w-2xl w-full mx-4 text-center transform transition-all hover:shadow-xl">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Thank You for Your Feedback!
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Your responses have been successfully recorded.
        </p>

        <div className="text-gray-500">You can now close this window.</div>
      </div>
    </div>
  );
}
