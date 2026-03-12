"use client";

import { useCallback, useMemo, useState } from "react";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

declare global {
  interface Window {
    google?: any;
  }
}

export function useGoogleToken(clientId: string | undefined) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const requestToken = useCallback(async () => {
    if (!clientId) throw new Error("Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
    if (!window.google?.accounts?.oauth2?.initTokenClient) {
      throw new Error("No se cargo Google Identity Services.");
    }

    const token = await new Promise<string>((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/calendar.events",
        callback: (resp: TokenResponse) => {
          if (!resp?.access_token) {
            reject(new Error("No se recibio access token."));
            return;
          }
          resolve(resp.access_token);
        },
        error_callback: (e: unknown) => {
          reject(new Error(typeof e === "string" ? e : "Error OAuth."));
        },
      });

      tokenClient.requestAccessToken({ prompt: "" });
    });

    setAccessToken(token);
    return token;
  }, [clientId]);

  return useMemo(
    () => ({
      accessToken,
      requestToken,
      clear: () => setAccessToken(null),
    }),
    [accessToken, requestToken],
  );
}

