"use client";

import { ToeicDiagnosisClient } from "@/components/features/assessment/ToeicDiagnosisClient";

export default function AssessmentPage() {
  return (
    <div className="py-2">
      <ToeicDiagnosisClient mode="settings" />
    </div>
  );
}
