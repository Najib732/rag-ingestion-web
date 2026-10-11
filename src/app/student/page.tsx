import type { Metadata } from "next";
import { ScopeProvider } from "@/components/ScopeProvider";
import { StudentApp } from "@/components/student/StudentApp";

export const metadata: Metadata = { title: "StudyMate — Student" };

export default function StudentPage() {
  return (
    <ScopeProvider>
      <StudentApp />
    </ScopeProvider>
  );
}
