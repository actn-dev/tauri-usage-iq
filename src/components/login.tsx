
import { authClient } from "@/lib/auth/auth";


import { useState } from "react";

export function Login() {
    const session = authClient.useSession();
    const [showOrgSelector, setShowOrgSelector] = useState(false);
    const [hasActiveOrg, setHasActiveOrg] = useState(false);

    async function handleLogin() {
        const data = await authClient.signIn.social({
            provider: "google",
        });
        console.log("Login button clicked", data);
    }

    async function handleLogout() {
        await authClient.signOut();
    
    }

   
    if (session.isPending) {
        return <div>Loading...</div>;
    }

    if (session.error) {
        return <div>Error: {session.error.message}</div>;
    }

    if (session.data) {
        return (
            <div className="p-4">
                {showOrgSelector ? (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Welcome, {session.data.user.email}!
                            </p>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Logout
                            </button>
                        </div>
                        {/* <OrganizationSelector onOrganizationSelected={handleOrganizationSelected} /> */}
                    </div>
                ) : (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-medium">Welcome, {session.data.user.email}!</p>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Logout
                            </button>
                            {hasActiveOrg && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ Organization active - tracking enabled
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <button
                                // onClick={handleChangeOrganization}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Change Organization
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4">
            <button
                onClick={handleLogin}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Login with Google
            </button>
        </div>
    );
}