import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  const env = getPublicEnv();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <AuthForm
        action={signUp}
        title="Create account"
        subtitle={
          env.demoMode
            ? "Demo mode — creates a local session cookie."
            : `Join ${env.appName}`
        }
        submitLabel="Create account"
        footer={
          <p className="text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Sign in
            </Link>
          </p>
        }
      />
    </div>
  );
}
