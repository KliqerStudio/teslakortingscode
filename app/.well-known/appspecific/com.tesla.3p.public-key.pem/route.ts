const publicKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEV0FtOYJ/c6gFxmlKiumSfK/+zYsw
5z6Br1z54p+jfsdCsdxbPntfFUFJQ2IAsT0W92foQr1hNYfrBRSDmRjK4w==
-----END PUBLIC KEY-----
`;

export function GET() {
  return new Response(publicKey, {
    headers: {
      "Content-Type": "application/x-pem-file; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
