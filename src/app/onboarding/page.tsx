import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold">Business onboarding</h1>
      <p className="mt-4 text-wtva-muted">
        Full venue registration and verification upload matches the mobile app.
        For now, an admin can assign your venue and set verification status in the admin portal.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
        Go to dashboard
      </Link>
    </div>
  );
}
