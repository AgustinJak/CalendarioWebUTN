import ClientApp from "./client-app";

export const dynamic = "force-dynamic";

export default function Home() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null;
  const sharedEnabled = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.REPORT_HASH_SALT,
  );

  return <ClientApp googleClientId={googleClientId} sharedEnabled={sharedEnabled} />;
}
