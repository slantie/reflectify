"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/Reflectify.svg";

const animations = {
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.6 },
  },
};

export default function Home() {
  return (
    <main
      suppressHydrationWarning
      className="bg-gradient-to-br from-white/80 to-white dark:from-gray-900/80 dark:to-gray-900"
    >
      <div
        suppressHydrationWarning
        className="max-w-[1920px] mx-auto px-16 py-4 md:py-20"
      >
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          {...animations.fadeInScale}
        >
          <div className="space-y-8 mt-10 md:mt-20">
            <h1 className="text-7xl md:text-7xl font-black text-orange-500 tracking-tight">
              Reflectify
              <span className="block text-xl md:text-5xl text-gray-700 dark:text-gray-200 mt-4">
                Empower Growth Through Anonymous Feedback
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Create a culture of honest communication and continuous
              improvement with our anonymous feedback platform.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href="/login"
                className="px-6 py-3 md:px-8 md:py-4 bg-orange-500 rounded-xl text-white font-semibold text-lg 
                shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                Start Collecting Feedbacks
              </Link>
              <Link
                href="/about-us"
                className="px-6 py-3 md:px-8 md:py-4 border-2 border-orange-500 text-orange-500 rounded-xl font-semibold text-lg 
                shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-orange-50 hover:text-orange-600
                dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              >
                How It Works
              </Link>
            </div>
          </div>

          <div className="relative h-56 md:h-[450px]">
            <Image
              src={logo}
              alt="Reflectify Platform"
              fill
              className="object-contain dark:filter dark:brightness-90"
              priority
              quality={100}
            />
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 md:mt-20"
          {...animations.fadeInUp}
        >
          {[
            {
              title: "Anonymous Feedback",
              description:
          "Share honest thoughts without revealing your identity",
              icon: "🔒",
            },
            {
              title: "Custom Forms",
              description: "Create tailored feedback forms for your needs",
              icon: "📋",
            },
            {
              title: "Actionable Insights",
              description: "Transform feedback into meaningful improvements",
              icon: "💡",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md dark:shadow-gray-900 transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
          {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-10 md:top-20 left-10 md:left-20 w-36 md:w-72 h-36 md:h-72 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 md:bottom-20 right-10 md:right-20 w-48 md:w-96 h-48 md:h-96 bg-gray-50 dark:bg-gray-800 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
