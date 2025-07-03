"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import {
  SiNextdotjs,
  SiPostgresql,
  SiPrisma,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import { FaNodeJs } from "react-icons/fa";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import harsh from "../../../public/harsh2.jpg";
import kandarp from "../../../public/kandarp2.jpg";
import parin from "../../../public/parin.jpg";
import { FlipWords } from "../../components/ui/fip-words";

const techStack = [
  { icon: SiNextdotjs, name: "Next.js" },
  { icon: SiPostgresql, name: "PostgreSQL" },
  { icon: FaNodeJs, name: "Node.js" },
  { icon: SiTailwindcss, name: "Tailwind" },
  { icon: SiPrisma, name: "Prisma" },
  { icon: SiTypescript, name: "TypeScript" },
];

const teamMembers = [
  {
    name: "Kandarp Gajjar",
    role: "Full Stack Developer",
    email: "kandarp_22091@ldrp.ac.in",
    linkedin: "https://www.linkedin.com/in/kandarpgajjar",
    portfolio: "https://slantie.vercel.app/",
    github: "https://github.com/slantie/",
    bio: "Architecting robust solutions and crafting seamless user experiences",
    image: kandarp,
  },
  {
    name: "Harsh Dodiya",
    role: "Full Stack Developer",
    email: "harsh_22087@ldrp.ac.in",
    linkedin: "https://www.linkedin.com/in/dodiyaharsh",
    portfolio: "https://harshdodiya.me/",
    github: "https://github.com/HarshDodiya1/",
    bio: "Building scalable systems with a focus on performance and reliability",
    image: harsh,
  },
  {
    name: "Parin Dave",
    role: "Frontend Developer",
    email: "parin_220778@ldrp.ac.in",
    linkedin: "https://www.linkedin.com/in/parin-dave-800938267/",
    github: "https://www.github.com/HarshDodiya1/Reflectify",
    bio: "Creating intuitive interfaces with attention to detail and user experience",
    image: parin,
  },
];

export default function AboutUsPage() {
  const router = useRouter();
  const words = ["innovative", "seamless", "powerful", "intuitive"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const duration = 3250;

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const cycles = Math.floor(elapsed / duration);

      setCurrentIndex(cycles % teamMembers.length);
    }, duration);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    // <div className="min-h-screen bg-white">
    <div suppressHydrationWarning className="max-w-[1920px] mx-auto px-6 py-8">
      <div className="space-y-16">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-orange-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">About Us</h1>
        </div>

        {/* Hero Section with 40:60 split */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-0 min-h-[600px] pl-14 pr-14">
          {/* Left column - FlipWords (40%) */}
          <div className="lg:col-span-4 flex items-center">
            <div className="text-4xl font-bold text-black">
              Building
              <FlipWords words={words} duration={duration} />
              <br />
              feedback systems for education
            </div>
          </div>

          {/* Right column - Team Carousel (60%) */}
          <div className="lg:col-span-6 relative h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="group relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl transform transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
                  <div className="relative bg-white rounded-2xl border border-orange-100 h-full flex overflow-hidden">
                    {/* Full-height Image Section */}
                    <div className="relative w-[40%] h-full">
                      <Image
                        src={teamMembers[currentIndex].image}
                        alt={teamMembers[currentIndex].name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 40vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-8 flex flex-col">
                      <div className="mb-8">
                        <h3 className="text-3xl font-bold text-gray-800 mb-2">
                          {teamMembers[currentIndex].name}
                        </h3>
                        <p className="text-xl text-orange-600 font-medium">
                          {teamMembers[currentIndex].role}
                        </p>
                      </div>

                      <p className="text-xl text-gray-600 leading-relaxed flex-grow">
                        {teamMembers[currentIndex].bio}
                      </p>

                      <div className="flex gap-6 pt-6 border-t border-gray-100">
                        <a
                          href={`mailto:${teamMembers[currentIndex].email}`}
                          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors group"
                        >
                          <FaEnvelope className="h-8 w-8" />
                          <span className="text-md font-medium">Email</span>
                        </a>
                        <a
                          href={`${teamMembers[currentIndex].linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors group"
                        >
                          <FaLinkedin className="h-8 w-8" />
                          <span className="text-md font-medium">LinkedIn</span>
                        </a>
                        <a
                          href={`${teamMembers[currentIndex].github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors group"
                        >
                          <FaGithub className="h-8 w-8" />
                          <span className="text-md font-medium">GitHub</span>
                        </a>
                      </div>

                      {/* Navigation Dots */}
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        {teamMembers.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              idx === currentIndex
                                ? "bg-orange-500 w-6"
                                : "bg-orange-200 hover:bg-orange-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Tech Stack Section */}
        {/* Tech Stack Section */}
        <div className="rounded-2xl bg-gray-50 p-12 overflow-hidden">
          <h2 className="text-4xl font-bold text-orange-500 mb-10">
            Our Tech Stack
          </h2>
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
            className="flex space-x-[16rem]"
          >
            {[...techStack, ...techStack].map((tech, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-3 group flex-shrink-0"
              >
                <tech.icon className="w-24 h-24 text-gray-600 group-hover:text-orange-500 transition-colors transform group-hover:scale-110 duration-300" />
                <span className="text-base font-medium text-gray-600">
                  {tech.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Contact Section */}
        <div className="rounded-2xl bg-orange-50 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Let&apos;s Connect
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions about Reflectify? We&apos;d love to hear from you and
            discuss how we can help transform your institution&apos;s feedback
            system.
          </p>
          <a
            href="mailto:team@reflectify.com"
            className="inline-flex items-center justify-center px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  );
}
