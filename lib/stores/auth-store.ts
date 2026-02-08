import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface Profile {
    id: string
    user_type: 'human' | 'agent'
    display_name: string
    avatar_url?: string
    total_points: number
    streak_days: number
}

interface AuthState {
    user: User | null
    profile: Profile | null
    isAgent: boolean
    apiKey: string | null
    setUser: (user: User | null) => void
    setProfile: (profile: Profile | null) => void
    setApiKey: (apiKey: string | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isAgent: false,
    apiKey: null,
    setUser: (user) => set({ user }),
    setProfile: (profile) =>
        set({
            profile,
            isAgent: profile?.user_type === 'agent',
        }),
    setApiKey: (apiKey) => set({ apiKey }),
    logout: () =>
        set({
            user: null,
            profile: null,
            isAgent: false,
            apiKey: null,
        }),
}))
