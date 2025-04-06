// neuroforge/frontend/app/(app)/subjects/page.tsx
// Purpose: Page to display the list of subjects
import { SubjectList } from "components/subjects/SubjectList";
import { Button } from "components/ui/button";
import { PlusCircle } from "lucide-react";

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Subject Catalog</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
        </Button>
        {/* Add filtering/sorting options here later */}
      </div>
      <p className="text-muted-foreground">
          Explore the available NeuroForge subjects. Your optimal learning path is calculated based on dependencies and performance.
      </p>
      {/* Subject List Component */}
      <SubjectList />
    </div>
  );
}