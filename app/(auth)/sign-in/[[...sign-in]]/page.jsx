import { SignIn } from "@clerk/nextjs";

export default function Page() {
  // Always land on the home page after sign-in (overrides the env-default
  // /dashboard). forceRedirectUrl takes precedence over search params, so even
  // a deep link like /sign-in?redirect_url=/resume lands here after login.
  return <SignIn forceRedirectUrl="/" />;
}
