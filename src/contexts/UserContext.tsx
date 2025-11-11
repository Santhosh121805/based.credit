import { createContext, useState, useEffect } from 'react';

interface User {
  name: string;
  registeredAt: string;
}

interface UserContextType {
  user: User | null;
  isRegistered: boolean;
  register: (userData: { name: string }) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'trust-ai-weave-user';

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  const register = (userData: { name: string }) => {
    const newUser: User = {
      ...userData,
      registeredAt: new Date().toISOString()
    };
    
    setUser(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isRegistered: !!user,
        register,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};