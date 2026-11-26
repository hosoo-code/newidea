export default function Loading() {
  return (
    <div className="min-h-screen pt-24 flex justify-center" aria-busy="true">
      <div className="h-8 w-8 rounded-full border-2 border-gray-700 border-t-theme-primary animate-spin" />
    </div>
  );
}
