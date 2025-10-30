/**
 * Component to display when no organization is selected.
 * Shows a consistent message across all pages that require organization context.
 */
export function NoOrganizationState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select or create an organization to continue.
          </p>
        </div>
      </main>
    </div>
  );
}
