import ClientApp from "./client-app";

export default function Home() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null;
  return <ClientApp googleClientId={googleClientId} />;
}
