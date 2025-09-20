import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import api from '../services/api';

// Define the structure of the user object based on your backend schema
interface User {
  id: number;
  email: string;
  username: string;
  role: 'super_admin' | 'company_admin' | 'department_head' | 'employee';
  company_id: number;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  department_id: number | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  console.log("UserContext: UserProvider component initialized");

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    console.log("UserContext: fetchUser function started");
    const token = localStorage.getItem('access_token');
    console.log("UserContext: Retrieved token from localStorage:", token ? `Token exists: ${token.substring(0, 20)}...` : "No token");

    setIsLoading(true);

    if (token) {
      try {
        console.log("UserContext: Making API call to /users/me");
        const response = await api.get('/users/me');
        console.log("UserContext: Fetched user data from /users/me:", response.data);
        console.log("UserContext: User email:", response.data.email);
        console.log("UserContext: User role:", response.data.role);
        console.log("UserContext: Setting user state...");
        setUser(response.data);
        console.log("UserContext: User state set successfully");
      } catch (error) {
        console.error("UserContext: Failed to fetch user:", error);
        // This could be due to an expired token, so we could clear it.
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } else {
      console.log("UserContext: No token found, setting user to null");
      setUser(null);
    }
    console.log("UserContext: Setting isLoading to false");
    setIsLoading(false);
  };

  const refreshUser = async () => {
    console.log("UserContext: refreshUser called");
    await fetchUser();
  };

  useEffect(() => {
    console.log("UserContext: useEffect triggered");
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
