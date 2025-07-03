export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className={`font-geist-sans text-lg text-gray-600`}>
          Loading your schedule...
        </p>
      </div>
    </div>
  );
}
