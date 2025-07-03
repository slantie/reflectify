"use client";

// import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function HeaderWrapper() {
  // const { user } = useAuth();
  const pathname = usePathname();

  // Don't render header on login page
  if (pathname === "/login") return null;
  // if (pathname === "/feedback/*") return null;

  return <Header />;
}
