import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // onAuthStateChange dispara INITIAL_SESSION no boot e em login/logout/refresh,
    // mantendo o user em sincronia mesmo que o getSession acima atrase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Salvaguarda: se o getSession travar, libera a UI em vez de spinner infinito.
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 3000)

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signOut }
}
