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
			let user: User | null = null;

			try {
				user = await getUserData(publicKey);
				if (user) {
					console.log("existingUser", user);
					setUser(user);
					setIsAuthenticated(true);
				}
			} catch (error) {
				try {
					console.log("user not found", error);

					user = {
						name,
						publicKey: publicKey,
						role: Role.Investor,
					};

					await registerUser(user);
				} catch (error) {
					console.error("error registering user", error);
					throw error;
				}
			}

			setUser(user);
			setIsAuthenticated(true);
			localStorage.setItem("user", JSON.stringify(user));

			if (user.role === Role.Landlord) {
				router.push("/landlord");
			} else {
				router.push("/invest");
			}
		},
		[router]
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
