import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">CLIC CRM</h1>
          <p className="text-muted-foreground mt-2">
            Inicia sesión para continuar
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}
