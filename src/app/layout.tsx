import "./globals.css";

import { titilliumWeb } from "./fonts";
import AuthProvider from "../components/AuthProvider";

export const metadata = {
  title: 'Recipe Hub', 
  description: 'Your favorite recipes in one place',
};

export default function RootLayout({ children }: {children: React.ReactNode }) {
  return(
    <html lang="en">
      <body className={ titilliumWeb.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}