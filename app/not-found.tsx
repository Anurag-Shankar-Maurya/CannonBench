import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md space-y-4">
        <div className="font-mono text-sm text-orange-600 font-bold">404 ERROR</div>
        <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="text-sm text-slate-600">
          The requested page could not be located on the CannonBench workbench.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
