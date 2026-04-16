"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import SuperAdminOverview from "@/components/SuperAdminOverview";
import OrgDashboard from "@/components/OrgDashboard";
import EmployeeDashboard from "@/components/EmployeeDashboard";

export default function Dashboard() {
  const { user } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  if (user.role === "SUPER_ADMIN") {
    return <SuperAdminOverview />;
  } else if (user.role === "ORGANIZATION") {
    return <OrgDashboard user={user} />;
  } else {
    return <EmployeeDashboard user={user} />;
  }
}
