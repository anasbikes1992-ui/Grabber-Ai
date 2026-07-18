import { PageTransition } from "@/components/motion-ui";

/** Re-mounts on every console navigation so each page animates in. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
