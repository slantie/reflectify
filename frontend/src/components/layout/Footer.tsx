"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Mail,
    MapPin,
    Phone,
} from "lucide-react";

const quickLinks = [
    { name: "About Us", href: "/about-us" },
    { name: "Contact", href: "/contact" },
    // { name: "Features", href: "/features" },
    // { name: "Privacy Policy", href: "/privacy" },
];

const resources = [
    { name: "Documentation", href: "/docs" },
    // { name: "Help Center", href: "/help" },
    { name: "FAQs", href: "/faqs" },
    { name: "Assets", href: "/assets" },
    // { name: "Support", href: "/support" },
];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-secondary-darker border-t border-secondary-lighter dark:border-secondary-darker"
        >
            <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <motion.div
                            className="text-3xl font-bold"
                            animate={{
                                opacity: [0.8, 1, 0.8],
                            }}
                            transition={{
                                duration: 3,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                        >
                            <span className="bg-gradient-to-r from-primary-dark to-primary-dark bg-clip-text text-transparent">
                                Reflectify
                            </span>
                        </motion.div>
                        <p className="text-secondary-dark dark:text-secondary-main leading-relaxed">
                            Empowering educational institutions with
                            comprehensive feedback management solutions for a
                            better learning experience.
                        </p>
                        <div className="flex space-x-5">
                            {[
                                { icon: Facebook, href: "#" },
                                { icon: Twitter, href: "#" },
                                { icon: Instagram, href: "#" },
                                { icon: Linkedin, href: "#" },
                            ].map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-full bg-primary-lighter dark:bg-primary-darker/20 text-primary-dark dark:text-light-primary hover:bg-primary-lighter dark:hover:bg-primary-darker/30 transition-colors"
                                >
                                    <social.icon className="h-5 w-5" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-secondary-darker dark:text-white">
                            Quick Links
                        </h3>
                        <ul className="space-y-4">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href}>
                                        <motion.span
                                            className="text-secondary-dark dark:text-secondary-main hover:text-primary-dark dark:hover:text-light-primary cursor-pointer inline-block"
                                            whileHover={{ x: 5 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                            }}
                                        >
                                            {link.name}
                                        </motion.span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-secondary-darker dark:text-white">
                            Resources
                        </h3>
                        <ul className="space-y-4">
                            {resources.map((resource) => (
                                <li key={resource.name}>
                                    <Link href={resource.href}>
                                        <motion.span
                                            className="text-secondary-dark dark:text-secondary-main hover:text-primary-dark dark:hover:text-light-primary cursor-pointer inline-block"
                                            whileHover={{ x: 5 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                            }}
                                        >
                                            {resource.name}
                                        </motion.span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-secondary-darker dark:text-white">
                            Contact Us
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-primary-dark mt-1" />
                                <span className="text-secondary-dark dark:text-secondary-main">
                                    reflectify.ldrp@gmail.com
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-primary-dark mt-1" />
                                <span className="text-secondary-dark dark:text-secondary-main">
                                    LDRP Institute of Technology & Research,
                                    <br />
                                    Near KH-5, Sector-15,
                                    <br />
                                    Gandhinagar, Gujarat 382015
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-secondary-lighter dark:border-secondary-darker py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-secondary-dark dark:text-secondary-main">
                            © {currentYear} Reflectify. All rights reserved.
                        </p>
                        <motion.p
                            className="text-secondary-dark dark:text-secondary-main"
                            whileHover={{ scale: 1.02 }}
                        >
                            Created by Team Reflectify (Kandarp Gajjar, Harsh
                            Dodiya & Parin Dave)
                        </motion.p>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}
