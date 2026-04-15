import React from 'react'
import { ModalProvider } from '@/app/hooks/useModal'
import { ProfileProvider } from '@/app/contexts/ProfileContext'
import ModalParent from '../Modal/ModalParent'
import ThemeSwitcher from '../ThemeSwitcher'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

type LayoutProps = {
    children?: React.ReactNode
}

const Layout:React.FC<LayoutProps> = ({ children }) => {

    return (
        <ModalProvider>
            <ProfileProvider>
                <ThemeSwitcher />
                <ToastContainer theme='colored' pauseOnHover={false}/>
                <ModalParent />
                {children}
            </ProfileProvider>
        </ModalProvider>
    )
}

export default Layout