import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px' }}>
        <h1>Affiliate Marketing Platform</h1>
        <p>Application is loading successfully.</p>
        <div>
          <button>Login</button>
          <button>Dashboard</button>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default SimpleApp;