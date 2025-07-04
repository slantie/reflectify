"use client";

import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
    Menu,
    X,
    Info,
    BookOpen,
    Phone,
    ChevronDown,
    UserCog,
    LogOut,
} from "lucide-react";
import logo from "../../../public/Logo.svg";

interface NavigationItem {
    name: string;
    href: string;
    icon?: React.ElementType;
}

const publicNavigation: NavigationItem[] = [
    { name: "About Us", href: "/about-us", icon: Info },
    { name: "Features", href: "/features", icon: BookOpen },
    { name: "Contact", href: "/contact", icon: Phone },
];

const privateNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Faculty Matrix", href: "/faculty-matrix-upload" },
    { name: "Upload Data", href: "/upload-data" },
    { name: "Feedback Forms", href: "/feedback-forms" },
    { name: "Analytics", href: "/analytics" },
    { name: "Faculty Analytics", href: "/faculty-analytics" },
    { name: "Holistic Analytics", href: "/holistic-analytics" },
];

export function Header() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();

    const memoizedNavigation = useMemo(
        () => (user ? privateNavigation : publicNavigation),
        [user]
    );

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
        document.documentElement.classList.toggle("dark");
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsDropdownOpen(false);
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsDropdownOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.5,
            }}
            className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
        >
            <div className="mx-auto w-full-[20rem] px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Link
                            href="/"
                            className="flex items-center gap-2"
                            onClick={scrollToTop}
                        >
                            <Image
                                src={logo}
                                alt="Reflectify Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                                priority
                            />
                            <motion.span
                                className="text-2xl md:text-3xl font-bold"
                                animate={{
                                    scale: [1, 1.02, 1],
                                    opacity: [0.9, 1, 0.9],
                                }}
                                transition={{
                                    duration: 2,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                }}
                            >
                                <span className="text-orange-500">
                                    Reflectify
                                </span>
                            </motion.span>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-6">
                            {memoizedNavigation.map((item) => (
                                <Link key={item.name} href={item.href}>
                                    <motion.div
                                        className="relative px-3 py-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {pathname === item.href && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                                                transition={{
                                                    type: "spring",
                                                    bounce: 0.2,
                                                    duration: 0.6,
                                                }}
                                            />
                                        )}
                                        <motion.div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">
                                            {!user && item.icon && (
                                                <item.icon className="w-4 h-4" />
                                            )}
                                            <span
                                                className={`relative z-10 text-sm font-medium ${
                                                    pathname === item.href
                                                    // ? "text-orange-600 dark:text-orange-400"
                                                    // : "text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400"
                                                }`}
                                            >
                                                {item.name}
                                            </span>
                                        </motion.div>
                                    </motion.div>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button> */}

                        <div className="lg:hidden">
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Toggle mobile menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                ) : (
                                    <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                )}
                            </button>
                        </div>

                        <div className="hidden lg:flex items-center gap-6">
                            {!user ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center gap-4"
                                >
                                    <Link href="/login">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 text-md font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                                        >
                                            Log in
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="relative" ref={dropdownRef}>
                                    {isLoading ? (
                                        <motion.div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    ) : (
                                        <motion.div
                                            className="flex items-center gap-6"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <button
                                                type="button"
                                                aria-label="User menu"
                                                onClick={() =>
                                                    setIsDropdownOpen(
                                                        !isDropdownOpen
                                                    )
                                                }
                                                className="flex items-center gap-3 cursor-pointer"
                                                aria-expanded={
                                                    isDropdownOpen
                                                        ? true
                                                        : false
                                                }
                                                aria-haspopup="true"
                                            >
                                                <motion.div
                                                    className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 grid place-items-center text-white font-medium"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {user.name.charAt(0)}
                                                </motion.div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {user.name}
                                                        </span>
                                                        {user.isSuper && (
                                                            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChevronDown
                                                        className={`w-4 h-4 transition-transform duration-200 ${
                                                            isDropdownOpen
                                                                ? "rotate-180"
                                                                : ""
                                                        }`}
                                                    />
                                                </div>
                                            </button>
                                        </motion.div>
                                    )}
                                    {/* // Replace the existing dropdown section with this enhanced */}
                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                    y: -10,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                    y: -10,
                                                }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: [0.4, 0, 0.2, 1],
                                                }}
                                                className="absolute right-0 mt-4 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 pb-2"
                                            >
                                                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                    <p className="text-md font-semibold text-gray-900 dark:text-gray-100">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <div className="">
                                                    <Link href="/edit-profile">
                                                        <motion.div
                                                            className="flex mt-2 items-center gap-2 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                                                            whileHover={{
                                                                x: 2,
                                                            }}
                                                        >
                                                            <div className="p-1 rounded-lg bg-orange-200 dark:bg-orange-900/30">
                                                                <UserCog className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                            </div>
                                                            <span>
                                                                Edit Profile
                                                            </span>
                                                        </motion.div>
                                                    </Link>

                                                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2"></div>

                                                    <motion.button
                                                        onClick={logout}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                        whileHover={{
                                                            x: 2,
                                                        }}
                                                    >
                                                        <div className="p-1 rounded-lg bg-red-200 dark:bg-red-900/30">
                                                            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        </div>
                                                        <span>Sign out</span>
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            className="lg:hidden border-t border-gray-100 dark:border-gray-800 py-4"
                        >
                            <nav className="flex flex-col gap-2">
                                {memoizedNavigation.map((item) => (
                                    <Link key={item.name} href={item.href}>
                                        <motion.div
                                            className={`px-4 py-2 rounded-lg ${
                                                pathname === item.href
                                                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {!user && item.icon && (
                                                    <item.icon className="w-4 h-4" />
                                                )}
                                                {item.name}
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                                {user && (
                                    <>
                                        <Link href="/edit-profile">
                                            <motion.div
                                                whileTap={{ scale: 0.98 }}
                                                className="px-6 py-3 text-left text-md font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2"
                                            >
                                                <UserCog className="w-5 h-5" />
                                                Edit Profile
                                            </motion.div>
                                        </Link>
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={logout}
                                            className="w-full px-6 py-3 text-left text-md font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Logout
                                        </motion.button>
                                    </>
                                )}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
