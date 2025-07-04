"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-secondary-lighter to-white p-4">
            <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-6xl font-black text-primary-dark">404</h1>
                <p className="text-xl text-secondary-dark max-w-md">
                    The page you&apos;re looking for doesn&apos;t exist or has
                    been moved.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block px-6 py-3 bg-primary-dark text-white rounded-xl hover:bg-primary-dark transition-colors"
                >
                    Return to Dashboard
                </Link>
            </motion.div>
        </main>
    );
}
