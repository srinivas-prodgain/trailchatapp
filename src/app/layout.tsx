import "./globals.css";
import Sidebar from "./components/Sidebar";

const conversations = [
  { id: "1", name: "Chat 1" },
  { id: "2", name: "Chat 2" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100">
        <Sidebar conversations={conversations} />
        <div className="flex-1 flex flex-col relative bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
