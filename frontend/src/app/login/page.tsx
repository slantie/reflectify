"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import toast from "react-hot-toast";
import Image from "next/image";
import loginImage from "/public/BG.svg";

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
            toast.success("Login successful!");
            window.location.href = "/dashboard";
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Login failed";
            toast.error(errorMessage);
        }
    };

    return (
        <div className="flex flex-col min-h-screen lg:flex-row bg-gradient-to-br from-primary-lighter via-white to-primary-lighter">
            <div className="hidden lg:flex flex-col w-1/2">
                <div className="flex-grow flex items-center justify-center ml-8">
                    <Image
                        src={loginImage}
                        alt="Login illustration"
                        className="h-[100vh] w-auto"
                        priority
                    />
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-primary-lighter p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-dark to-primary-dark bg-clip-text text-transparent">
                                Login to Reflectify
                            </h1>
                            <p className="text-secondary-lighter0 mt-2">
                                Sign in to your account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-secondary-dark block"
                                >
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-3.5 bg-white border border-secondary-lighter rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark transition-all duration-200"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-secondary-dark block"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                password: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3.5 bg-white border border-secondary-lighter rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark transition-all duration-200"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-main hover:text-secondary-dark transition-colors"
                                    >
                                        {showPassword ? (
                                            <RiEyeOffLine size={20} />
                                        ) : (
                                            <RiEyeLine size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-gradient-to-r from-primary-dark to-primary-dark text-white rounded-xl text-lg font-semibold transition-all hover:from-primary-dark hover:to-primary-darker focus:ring-2 focus:ring-primary-dark/50 shadow-lg shadow-primary-dark/30"
                            >
                                Sign In
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
