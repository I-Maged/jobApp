import { LoginButtons } from "@/components/auth/LoginButtons";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-accent-muted px-8 py-12 text-center md:px-10 md:py-14">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-darkest md:text-4xl">
          Sign in to JobPilot
        </h1>
        <p className="mt-4 text-base leading-6 text-text-secondary md:text-lg">
          Continue with Google or GitHub to pick up where you left off.
        </p>
        <div className="mt-10">
          <LoginButtons />
        </div>
      </div>
    </div>
  );
}
