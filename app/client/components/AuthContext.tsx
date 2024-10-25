"use client";
import { getUserData, registerUser } from "@/services/user";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  login: (publicKey: string, name?: string) => Promise<void>;
  logout: () => void;
}

export enum Role {
  Investor = "investor",
  Landlord = "landlord",
}

export interface User {
  name: string;
  publicKey: string;
  role: Role;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(
    async (publicKey: string, name?: string): Promise<void> => {
      let user = await getUserData(publicKey);

      if (user) {
        console.log("existingUser", user);
        setUser(user);
        setIsAuthenticated(true);
      } else if (name) {
        user = {
          name,
          publicKey: publicKey,
          role: Role.Investor,
        };

        await registerUser(user);

        setUser(user);
        setIsAuthenticated(true);
      } else {
        throw new Error("User not found");
      }

      console.log("user logged or registered", user);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("user", user);

      if (user.role === Role.Landlord) {
        router.push("/landlord");
      } else {
        router.push("/invest");
      }
    },
    [router],
  );

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setUser(JSON.parse(user));
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
