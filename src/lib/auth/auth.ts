import { createAuthClient } from "better-auth/react"

import { organizationClient, emailOTPClient } from "better-auth/client/plugins"

// export const API_BASE_URL = 'https://dodily-nextjs.vercel.app';
export const API_BASE_URL = 'http://192.168.0.200:3000';
// export const API_BASE_URL = 'http://localhost:3000';
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: API_BASE_URL,
    plugins: [organizationClient(), emailOTPClient()],
    fetchOptions: {
        // Handle bearer token on successful authentication
        onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token");
            if (authToken) {
                console.log("📝 Storing bearer token");
                localStorage.setItem("bearer_token", authToken);
            }
        },
        // Configure bearer token authentication
        auth: {
            type: "Bearer",
            token: () => {
                const token = localStorage.getItem("bearer_token") || "";
                if (token) {
                    console.log("🔑 Using bearer token for request");
                }
                return token;
            }
        }

    },
    sessionOptions: {
        refetchOnWindowFocus: false, // Disable automatic refetching on window focus
    }
})             