"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/"});
  };

  return(
    <div className="p-8">

      <div className="flex items-center mb-2">
        <h1 className="text-3xl font-bold">Welcome to</h1>
        <Image
          src="/logo.svg"
          width={200}
          height={80}
          alt="Recipe Hub Logo"
        />
      </div>

      <p className="mb-6">Your favorite recipes in one place</p>

      <h1 className="text-xl font-semibold mb-2">Auth Status:</h1>
      {status === "loading" ? (
        <p className="text-gray-600">Loading...</p>
      ) : session ? (
        <div className="space-y-2">
          <p className="text-green-600">Logged in as: {session.user?.email}</p>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      ) : (
        <p className="text-red-600">Not logged in</p>
      )}
    
    </div>
  );
}