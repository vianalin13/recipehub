import NextAuth from "next-auth";

import { authOptions } from "./authOptions";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

//configure shared state
//frontend add react hook
//backend api route