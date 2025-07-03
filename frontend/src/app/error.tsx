"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-6xl font-black text-orange-500">Oops!</h1>
        <p className="text-xl text-gray-600 max-w-md">
          {error.message || "Something went wrong. Please try again."}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
