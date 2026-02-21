import type { MockPolicy } from "@/data/mock/policies";

const createdPolicies: MockPolicy[] = [];

export function getCreatedPolicies(): MockPolicy[] {
  return [...createdPolicies];
}

export function addCreatedPolicy(policy: MockPolicy): void {
  createdPolicies.push(policy);
}

export function removeCreatedPolicy(id: string): boolean {
  const i = createdPolicies.findIndex((p) => p.id === id);
  if (i >= 0) {
    createdPolicies.splice(i, 1);
    return true;
  }
  return false;
}
