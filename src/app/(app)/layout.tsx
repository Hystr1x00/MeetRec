import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main
                style={{
                    flex: 1,
                    overflowY: "auto",
                    background: "var(--bg-primary)",
                }}
            >
                {children}
            </main>
        </div>
    );
}
