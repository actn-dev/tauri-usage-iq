import { authClient } from "@/lib/auth/auth";
import { useState, useEffect } from "react";
import { Building2, Check } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: any;
}

interface OrganizationSelectorProps {
  onOrganizationSelected: () => void;
}

export function OrganizationSelector({ onOrganizationSelected }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const { data: activeOrganization } = authClient.useActiveOrganization();

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Update selected org when active org changes
  useEffect(() => {
    if (activeOrganization) {
      setSelectedOrgId(activeOrganization.id);
    }
  }, [activeOrganization]);

  async function loadOrganizations() {
    try {
      setLoading(true);
      
      // Use Better Auth organization plugin method
      const { data, error } = await authClient.organization.list();
      
      if (error) {
        console.error("Failed to fetch organizations:", error);
        return;
      }

      // data contains the user's organizations
      if (data && Array.isArray(data)) {
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectOrg(orgId: string) {
    try {
      // Set active organization using Better Auth
      const { error } = await authClient.organization.setActive({
        organizationId: orgId,
      });

      if (error) {
        console.error("Failed to set active organization:", error);
        return;
      }

      setSelectedOrgId(orgId);
      
      // Notify parent component
      onOrganizationSelected();
    } catch (error) {
      console.error("Error setting organization:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center p-8">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h3 className="text-lg font-semibold mb-2 text-slate-200">No Organizations Found</h3>
        <p className="text-sm text-slate-400 mb-4">
          You need to be a member of an organization to sync data.
        </p>
        <p className="text-xs text-slate-500">
          Please create or join an organization from the web dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-2 text-slate-200">Select Organization</h3>
      <p className="text-sm text-slate-400 mb-4">
        Choose which organization to sync your activity data to:
      </p>
      <div className="space-y-2">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => handleSelectOrg(org.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedOrgId === org.id
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-slate-700 hover:border-slate-600 bg-slate-700/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">{org.name}</div>
                  <div className="text-xs text-slate-500">@{org.slug}</div>
                </div>
              </div>
              {selectedOrgId === org.id && (
                <Check className="w-5 h-5 text-blue-400" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
