import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConciergeBell, SprayCan, Wrench } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ErrorBanner } from '../components/common/EmptyState';
import { DEPARTMENTS } from '../utils/constants';

const OPTIONS = [
  { value: 'FRONT_DESK', label: 'Front Desk', hint: 'Admin, rooms and tickets', icon: ConciergeBell },
  { value: 'HOUSEKEEPING', label: 'Housekeeping', hint: 'Clean and inspect rooms', icon: SprayCan },
  { value: 'ENGINEERING', label: 'Engineering', hint: 'Repairs and checks', icon: Wrench },
];

export default function LoginPage() {
  const { login, status, user, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [department, setDepartment] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Sign in | Room Turnover'; }, []);

  if (status === 'authenticated' && user) return <Navigate to={DEPARTMENTS[user.department].home} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!department) errs.department = 'Choose your department.';
    if (!userId.trim()) errs.userId = 'Enter your user ID.';
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setApiError(null);
    try {
      const u = await login(department, userId.trim(), password);
      const home = DEPARTMENTS[u.department].home;
      const from = location.state?.from;
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      setApiError(err);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(26rem,32rem)]">
      <section className="relative hidden overflow-hidden bg-harbor-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-white/10 font-bold">H</span>
          <span className="font-semibold">Room Turnover</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight text-white">Every room checked before the next guest walks in.</h1>
          <p className="mt-4 text-harbor-100">Checkout, cleaning, inspection, repairs and release, tracked room by room.</p>
        </div>
        <div className="grid grid-cols-6 gap-1.5 opacity-80" aria-hidden>
          {['bg-emerald-500', 'bg-sky-400', 'bg-emerald-500', 'bg-orange-500', 'bg-emerald-500', 'bg-violet-500',
            'bg-sky-600', 'bg-emerald-500', 'bg-emerald-500', 'bg-red-500', 'bg-emerald-500', 'bg-sky-400'].map((c, i) => (
            <div key={i} className="rounded bg-white/10 p-2">
              <div className={`h-1 w-6 rounded ${c}`} />
              <p className="room-no mt-2 text-sm font-semibold">{(i < 6 ? 301 : 201) + (i % 6)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate aria-labelledby="login-title">
          <div>
            <h2 id="login-title" className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-gray-600">Choose your department, then enter the user ID your administrator gave you.</p>
          </div>

          {sessionMessage && !apiError && <p className="rounded-md bg-harbor-50 px-3 py-2 text-sm text-harbor-800">{sessionMessage}</p>}
          <ErrorBanner error={apiError} />

          <fieldset>
            <legend className="label">Department</legend>
            <div className="grid gap-2" role="radiogroup">
              {OPTIONS.map(({ value, label, hint, icon: Icon }) => {
                const active = department === value;
                return (
                  <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 ${active ? 'border-harbor-700 bg-harbor-50 ring-1 ring-harbor-700' : 'border-gray-300 bg-white hover:border-harbor-600'}`}>
                    <input type="radio" name="department" value={value} checked={active} onChange={() => setDepartment(value)} className="sr-only" />
                    <Icon className={`h-5 w-5 ${active ? 'text-harbor-700' : 'text-gray-500'}`} aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-gray-500">{hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.department && <p className="error-text">{errors.department}</p>}
          </fieldset>

          <Input label="User ID" name="user_id" autoComplete="username" value={userId} error={errors.userId}
            onChange={(e) => setUserId(e.target.value)} required />
          <Input label="Password" name="password" type="password" autoComplete="current-password" value={password}
            error={errors.password} onChange={(e) => setPassword(e.target.value)} required />

          <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
        </form>
      </section>
    </div>
  );
}
