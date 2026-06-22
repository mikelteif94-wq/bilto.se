import { useEffect, useState } from 'react';
import { CircleUser as UserCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminUserLabel() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('admin_users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.name) setName(data.name);
      else if (user.email) setName(user.email.split('@')[0]);
    })();
  }, []);

  if (!name) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white/90 text-sm font-medium">
      <UserCircle2 className="w-4 h-4" />
      <span>{name}</span>
    </div>
  );
}
