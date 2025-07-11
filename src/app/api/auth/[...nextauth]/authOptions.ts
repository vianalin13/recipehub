import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import pool from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "username" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
        // logic to look up user from credents
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        //query user by username or email
        const result = await pool.query(`
          SELECT * 
          FROM users 
          WHERE username = $1 OR email = $1 
          LIMIT 1
          `,
          [credentials.username] //parameterize query, replaces $1
        );
        const user = result.rows[0];

        if (!user) {
          return null;
        }

        //compare password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        //return user object 
        return {
          id: user.id,
          name: user.username,
          email: user.email,
        };

      } 
    }),
    // TODO: Add Google provider here later
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};