import { useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useRecoilValue } from 'recoil'
import { currentUserAtom } from '../state/auth'

export default function useAuthz() {
  const me = useRecoilValue(currentUserAtom)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const session = await fetchAuthSession()
  const idGroups = (session.tokens?.idToken?.payload?.['cognito:groups'] as string[] | undefined) ?? []
  const accGroups = (session.tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined) ?? []
  const groups = (idGroups.length ? idGroups : accGroups).map(g => (g || '').toLowerCase())
  const groupAdmin = groups.includes('admin')
        const dbAdmin = (me?.role ?? '') === 'admin'
        if (!cancelled) setIsAdmin(groupAdmin || dbAdmin)
      } catch (_e) {
        const dbAdmin = (me?.role ?? '') === 'admin'
        if (!cancelled) setIsAdmin(dbAdmin)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [me?.role])

  return { isAdmin, loading }
}
