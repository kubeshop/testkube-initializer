import { useState, type FormEvent } from "react";
import Logo from "./Logo";
import { Field, TextInput } from "./ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginGateValues = {
  companyName: string;
  adminEmail: string;
};

export default function LoginGate({
  onSubmit,
}: {
  onSubmit: (values: LoginGateValues) => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const company = companyName.trim();
    const email = adminEmail.trim();

    if (!company) {
      setError("Company name is required.");
      return;
    }
    if (!email || !EMAIL_RE.test(email)) {
      setError("Enter a valid work email address.");
      return;
    }

    setError(null);
    onSubmit({ companyName: company, adminEmail: email });
  };

  return (
    <div className="tk-site-bg flex min-h-screen flex-col text-white">
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo height={52} />
          <p className="text-sm font-medium text-white">Initializer</p>
        </div>

        <div className="tk-card w-full max-w-md">
          <div className="tk-card-body">
            <div className="text-center">
              <h1 className="text-xl font-normal text-white">Sign in to continue</h1>
              <p className="mt-2 text-sm text-tk-muted">
                Tell us who you are to start configuring your Testkube deployment.
              </p>
            </div>

            <form className="mt-2 flex flex-col gap-4" onSubmit={handleSubmit}>
              <Field label="Company">
                <TextInput
                  autoFocus
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Field>

              <Field label="Work email">
                <TextInput
                  type="email"
                  placeholder="you@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </Field>

              {error && (
                <p className="rounded-tk border border-tk-error/40 bg-tk-error/10 px-3 py-2 text-sm text-tk-error">
                  {error}
                </p>
              )}

              <button type="submit" className="tk-btn-primary mt-1 w-full">
                Continue
              </button>
            </form>

            <p className="text-center text-xs text-tk-subtle">
              Authentication is not enforced yet — this step only captures your details for the
              wizard.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
