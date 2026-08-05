import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { getProfileRole } from '../../lib/profile';

const getAdminRole = async (userId: string) => getProfileRole(userId);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const { data: userData, error: _userError } = await supabase.auth.getUser();

    

    const session = result.data?.session ?? sessionData.session;
    const user = result.data?.user ?? userData.user ?? session?.user;

    

    if (sessionError || !session?.access_token || !user?.id) {
      setError('Supabase did not create a valid admin session. Please try again.');
      return;
    }

    

    try {
      const role = await getAdminRole(user.id);
      const isAdmin = role === 'admin' || user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';

      if (!isAdmin) {
        setError('This account is not registered as an admin. Please sign in with an admin account or create a matching admin profile in Supabase.');
        return;
      }
    } catch (adminError) {
      setError('We could not verify your admin access right now. Please try again.');
      return;
    }

    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-sand text-bark antialiased">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-bark/10 bg-white p-10 shadow-soft">
          <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Admin login</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-bark">Sign in to your studio account</h1>
          <p className="mt-4 text-sm leading-7 text-bark/70">
            Enter your email and password to access the dashboard.
          </p>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-bark">Email address</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-3 w-full rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-base text-bark outline-none transition focus:border-oak-500 focus:ring-4 focus:ring-oak-100"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-bark">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-3 w-full rounded-[1.5rem] border border-bark/10 bg-sand px-4 py-3 text-base text-bark outline-none transition focus:border-oak-500 focus:ring-4 focus:ring-oak-100"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="pt-2">
              <Button type="submit" className="w-full" loading={loading}>
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
