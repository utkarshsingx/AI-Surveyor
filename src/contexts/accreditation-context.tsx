"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchAccreditations, fetchFacilities } from "@/lib/api-client";

interface AccreditationOption {
  id: string;
  name: string;
  code: string;
}

interface FacilityOption {
  id: string;
  name: string;
}

interface AccreditationContextType {
  accreditations: AccreditationOption[];
  facilities: FacilityOption[];
  selectedAccreditation: AccreditationOption | null;
  selectedFacility: FacilityOption | null;
  setSelectedAccreditation: (acc: AccreditationOption | null) => void;
  setSelectedFacility: (fac: FacilityOption | null) => void;
  loading: boolean;
}

const AccreditationContext = createContext<AccreditationContextType>({
  accreditations: [],
  facilities: [],
  selectedAccreditation: null,
  selectedFacility: null,
  setSelectedAccreditation: () => {},
  setSelectedFacility: () => {},
  loading: true,
});

export function AccreditationProvider({ children }: { children: React.ReactNode }) {
  const [accreditations, setAccreditations] = useState<AccreditationOption[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [selectedAccreditation, setSelectedAccreditation] = useState<AccreditationOption | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAccreditations(), fetchFacilities()])
      .then(([accs, facs]) => {
        const accOpts = (accs as unknown as AccreditationOption[]).map((a) => ({
          id: a.id,
          name: a.name,
          code: a.code,
        }));
        const facOpts = facs.map((f) => ({ id: f.id, name: f.name }));
        setAccreditations(accOpts);
        setFacilities(facOpts);
        if (accOpts.length > 0) setSelectedAccreditation(accOpts[0]);
        if (facOpts.length > 0) setSelectedFacility(facOpts[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSetAccreditation = useCallback((acc: AccreditationOption | null) => {
    setSelectedAccreditation(acc);
  }, []);

  const handleSetFacility = useCallback((fac: FacilityOption | null) => {
    setSelectedFacility(fac);
  }, []);

  return (
    <AccreditationContext.Provider
      value={{
        accreditations,
        facilities,
        selectedAccreditation,
        selectedFacility,
        setSelectedAccreditation: handleSetAccreditation,
        setSelectedFacility: handleSetFacility,
        loading,
      }}
    >
      {children}
    </AccreditationContext.Provider>
  );
}

export function useAccreditation() {
  return useContext(AccreditationContext);
}
