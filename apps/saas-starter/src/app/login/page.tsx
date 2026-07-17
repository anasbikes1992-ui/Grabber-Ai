import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  const env = getPublicEnv();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <AuthForm
        action={signIn}
        title="Sign in"
        subtitle={
          env.demoMode
            ? "Demo mode — any email + password (6+ chars) works."
            : `Sign in to ${env.appName}`
        }
        submitLabel="Sign in"
        footer={
          <p className="text-zinc-600 dark:text-zinc-400">
            No account?{" "}
            <Link href="/signup" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Sign up
            </Link>
          </p>
        }
      />
    </div>
  );
}
