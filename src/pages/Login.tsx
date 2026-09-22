import { useState } from 'react';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Fields';
import { Logo } from '../components/Logo';
import { messageOf } from '../lib/errors';
import { useAuth } from '../state/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (email.trim() === '' || password === '') return setError('Please enter your email and password.');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(messageOf(e, 'Could not log in. Please try again.'));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <Logo className="text-4xl" />
      <p className="mb-8 mt-2 text-ink-soft">Store prices, stock and utang. For the family only.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
        />
        {error && <Banner tone="error">{error}</Banner>}
        <Button type="submit" variant="honey" size="lg" full disabled={busy}>
          {busy ? 'LOGGING IN…' : 'LOG IN'}
        </Button>
      </form>
    </main>
  );
}
