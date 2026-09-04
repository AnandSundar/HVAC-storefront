import type { ReactNode } from 'react';
import { getAdminToken } from '@/lib/admin-token';
import { SignOutButton } from '@/components/admin/SignOutButton';

/**
 * Shared chrome for every `/admin/*` route.
 *
 * Per the key technical decision recorded in the admin UI plan, this layout
 * intentionally does NOT call `redirect()` — the redirect-to-sign-in
 * responsibility lives in each protected page so `/admin/sign-in` itself
 * does not loop back to itself.
 *
 * It DOES read the token once, to decide whether to show the admin header
 * (with the sign-out button). The sign-in page is always rendered without
 * chrome so the user never sees a sign-out button before they've signed in.
 */
export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<React.ReactElement> {
  const token = await getAdminToken();
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-secondary/30">
      {token !== null ? (
        <header className="border-b border-border/60 bg-background">
          <div className="container mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold tracking-tight">Admin</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">HVAC Inventory</span>
            </div>
            <SignOutButton />
          </div>
        </header>
      ) : null}
      <main>{children}</main>
    </div>
  );
}
