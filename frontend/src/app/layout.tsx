import "./globals.css";

export const metadata = {
  title: "PersonalAIAsisstant",
  description: "IntelliText personal AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

