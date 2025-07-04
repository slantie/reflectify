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
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secondary-lighter to-white p-4">
            <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-6xl font-black text-primary-dark">Oops!</h1>
                <p className="text-xl text-secondary-dark max-w-md">
                    {error.message || "Something went wrong. Please try again."}
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-primary-dark text-white rounded-xl hover:bg-primary-dark transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-secondary-lighter text-secondary-dark rounded-xl hover:bg-secondary-lighter transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
