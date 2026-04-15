'use client'

import { createContext, useContext, useState, ReactNode, FC } from 'react'

type ProfileContextType = {
  avatar: string | null
  displayName: string
  setProfile: (avatar: string | null, displayName: string) => void
}

const ProfileContext = createContext<ProfileContextType>({
  avatar: null,
  displayName: '',
  setProfile: () => {},
})

export const ProfileProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [avatar, setAvatar] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')

  const setProfile = (a: string | null, d: string) => {
    setAvatar(a)
    setDisplayName(d)
  }

  return (
    <ProfileContext.Provider value={{ avatar, displayName, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
