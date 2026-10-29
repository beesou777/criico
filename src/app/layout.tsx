import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import './globals.css';
export const metadata: Metadata = {
  title: {
    default: 'Criico — Cricket. Community. Together.',
    template: '%s | Criico',
  },
  description:
    'Manage your grassroots cricket roster, record match performances, and understand every player’s impact.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <Toaster richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
