"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

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
        <p className="text-green-600">Logged in as: {session.user?.email}</p>
      ) : (
        <p className="text-red-600">Not logged in</p>
      )}
    
    </div>
  );
}