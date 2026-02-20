"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAccreditation } from "@/contexts/accreditation-context";

export default function ManageRedirectPage() {
  const router = useRouter();
  const { selectedAccreditation, loading } = useAccreditation();

  useEffect(() => {
    if (!loading && selectedAccreditation) {
      router.replace(`/accreditations/${selectedAccreditation.id}`);
    }
  }, [loading, selectedAccreditation, router]);

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#1a5276]" />
    </div>
  );
}
