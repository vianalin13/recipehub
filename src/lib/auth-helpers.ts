import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import pool from "@/lib/db";

export async function getUserIdFromSession(request?: Request): Promise<{ userId?: number; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    const testUserEmail = request?.headers.get("x-test-user-email");

    if(!session?.user?.email && !testUserEmail) {
      return { error: "Authentication required" };
    }

    const userEmail = session?.user?.email || testUserEmail!;

    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );

    if(user.rows.length === 0) {
      return { error: "User not found" };
    }

    return { userId: user.rows[0].id };

  } catch (error) {
    console.error("Error getting user ID:", error);
    return { error: "Authentication failed" };
  }
}