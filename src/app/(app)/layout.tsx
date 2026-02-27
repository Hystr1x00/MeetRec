import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full app-layout">
            <Sidebar />
            <main className="flex-1 w-full app-main relative">
                {children}
            </main>
        </div>
    );
}
