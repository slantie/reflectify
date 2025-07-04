"use client";

import { useAuth } from "@/context/AuthContext";
import { AUTH_ENDPOINTS } from "@/lib/apiEndPoints";
import {
    UserIcon,
    EnvelopeIcon,
    BriefcaseIcon,
    ShieldCheckIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const EditProfile = () => {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value,
        });
    };

    const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.put(
                AUTH_ENDPOINTS.UPDATE_PASSWORD,
                {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("Password updated successfully");
            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Failed to update password"
            );
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <div className="min-h-screen bg-primary-lighter/30 p-8">
            <motion.div
                className="max-w-7xl mx-auto"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-secondary-darker">
                        Profile Settings
                    </h1>
                    <p className="mt-2 text-secondary-dark">
                        Manage your account settings and security preferences
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div
                        className="lg:col-span-1"
                        variants={itemVariants}
                    >
                        <div className="bg-white rounded-2xl shadow-sm border border-primary-lighter p-6 hover:shadow-lg transition-shadow duration-300">
                            <h2 className="text-xl font-semibold text-secondary-darker mb-6">
                                Profile Information
                            </h2>
                            <div className="space-y-6">
                                {[
                                    {
                                        icon: UserIcon,
                                        label: "Name",
                                        value: user?.name,
                                    },
                                    {
                                        icon: EnvelopeIcon,
                                        label: "Email",
                                        value: user?.email,
                                    },
                                    {
                                        icon: BriefcaseIcon,
                                        label: "Designation",
                                        value: user?.designation,
                                    },
                                    {
                                        icon: ShieldCheckIcon,
                                        label: "Role",
                                        value: user?.isSuper
                                            ? "Super Admin"
                                            : "Admin",
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center space-x-3"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <item.icon className="h-6 w-6 text-primary-dark" />
                                        <div>
                                            <p className="text-sm text-secondary-lighter0">
                                                {item.label}
                                            </p>
                                            <p className="font-medium text-secondary-darker">
                                                {item.value}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:col-span-2"
                        variants={itemVariants}
                    >
                        <div className="bg-white rounded-2xl shadow-sm border border-primary-lighter p-6 hover:shadow-lg transition-shadow duration-300">
                            <h2 className="text-xl font-semibold text-secondary-darker mb-6">
                                Security Settings
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-secondary-dark mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type={
                                            showPasswords.current
                                                ? "text"
                                                : "password"
                                        }
                                        name="currentPassword"
                                        value={passwords.currentPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-primary-lighter focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-200"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            togglePasswordVisibility("current")
                                        }
                                        className="absolute right-3 top-9 text-secondary-main hover:text-primary-dark"
                                    >
                                        {showPasswords.current ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-secondary-dark mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type={
                                                showPasswords.new
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="newPassword"
                                            value={passwords.newPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-primary-lighter focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-200"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                togglePasswordVisibility("new")
                                            }
                                            className="absolute right-3 top-9 text-secondary-main hover:text-primary-dark"
                                        >
                                            {showPasswords.new ? (
                                                <EyeSlashIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-secondary-dark mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type={
                                                showPasswords.confirm
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="confirmPassword"
                                            value={passwords.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-primary-lighter focus:ring-2 focus:ring-primary-dark focus:border-transparent transition duration-200"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                togglePasswordVisibility(
                                                    "confirm"
                                                )
                                            }
                                            className="absolute right-3 top-9 text-secondary-main hover:text-primary-dark"
                                        >
                                            {showPasswords.confirm ? (
                                                <EyeSlashIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <motion.div
                                    className="flex justify-end"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-primary-dark text-white font-medium rounded-lg hover:bg-primary-dark focus:ring-4 focus:ring-primary-light transition duration-200"
                                    >
                                        Update Password
                                    </button>
                                </motion.div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default EditProfile;
