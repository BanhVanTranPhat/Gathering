export interface AppUser {
    id: string
    email?: string
    user_metadata?: { email?: string; displayName?: string }
}

class Users {
    private users: { [key: string]: AppUser } = {}

    addUser(id: string, user: AppUser) {
        this.users[id] = user
    }

    getUser(id: string): AppUser | undefined {
        return this.users[id]
    }

    removeUser(id: string) {
        delete this.users[id]
    }
}

const users = new Users()

export { users }

