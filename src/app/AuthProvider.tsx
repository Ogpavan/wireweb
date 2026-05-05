import {onIdTokenChanged, signInWithEmailAndPassword, signOut, type User} from 'firebase/auth'
import {createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren} from 'react'
import {publicApiClient} from '../services/apiClient'
import {firebaseAuth} from '../services/firebase'
import type {AuthState} from '../types/auth'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({children}: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return onIdTokenChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser)
      setToken(currentUser ? await currentUser.getIdToken() : null)
      setIsLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    setUser(credential.user)
    setToken(await credential.user.getIdToken())
  }, [])

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    await publicApiClient.post('/v1/auth/signup', {fullName, email, password})
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    setUser(credential.user)
    setToken(await credential.user.getIdToken())
  }, [])

  const logout = useCallback(async () => {
    await signOut(firebaseAuth)
    setUser(null)
    setToken(null)
  }, [])

  const refreshToken = useCallback(async () => {
    if (!firebaseAuth.currentUser) {
      setToken(null)
      return null
    }

    const nextToken = await firebaseAuth.currentUser.getIdToken(true)
    setToken(nextToken)
    return nextToken
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      signup,
      logout,
      refreshToken,
    }),
    [isLoading, login, logout, refreshToken, signup, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
