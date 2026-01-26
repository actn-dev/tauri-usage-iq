import { createAuthClient } from "better-auth/react"

import { organizationClient } from "better-auth/client/plugins"

// export const API_BASE_URL = 'https://dodily-nextjs.vercel.app';
export const API_BASE_URL = 'http://localhost:3000';
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: API_BASE_URL,
    plugins: [organizationClient()],
})