import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f4f6",
  },
  main: {
    flex: 1,
    padding: "0",
    minWidth: 0,
  },
};