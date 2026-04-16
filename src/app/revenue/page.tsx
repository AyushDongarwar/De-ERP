"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import RevenueLedger from "@/components/RevenueLedger";
import { useRouter } from "next/navigation";

export default function RevenuePage() {
  const { user } = useStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== "SUPER_ADMIN")) {
      router.push("/dashboard");
    }
  }, [mounted, user, router]);

  if (!mounted || !user || user.role !== "SUPER_ADMIN") return null;

  return <RevenueLedger />;
}
