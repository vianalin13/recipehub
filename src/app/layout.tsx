import './globals.css';

import { titilliumWeb } from './fonts';

export const metadata = {
  title: 'Recipe Hub', 
  description: 'Your favorite recipes in one place',
};

export default function RootLayout({ children }: {children: React.ReactNode }) {
  return(
    <html lang="en">
      <body className={ titilliumWeb.className}>{children}</body>
    </html>
  );
}