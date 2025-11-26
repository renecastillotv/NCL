import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">CLIC CRM</h1>
          <p className="text-muted-foreground mt-2">
            Crea tu cuenta para comenzar
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/onboarding"
        />
      </div>
    </div>
  );
}
