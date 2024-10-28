"use client";
import { getUserData, registerUser } from "@/services/user";
import { usePathname, useRouter } from "next/navigation";
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
	login: (publicKey: string) => Promise<void>;
	register: (publicKey: string, name: string, role?: Role) => Promise<void>;
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
	const pathname = usePathname();

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser) as User;
			setUser(parsedUser);
			setIsAuthenticated(true);
		}
	}, []);

	const register = async (
		publicKey: string,
		name: string,
		role?: Role
	): Promise<void> => {
		let newUser: User = {
			name,
			publicKey: publicKey,
			role: role || Role.Investor,
		};

		try {
			newUser = await registerUser(newUser);

			setUser(newUser);
			setIsAuthenticated(true);
			localStorage.setItem("user", JSON.stringify(newUser));

			if (newUser.role === Role.Landlord) {
				router.push("/landlord");
			} else {
				router.push("/invest");
			}
		} catch (registerError) {
			console.error("error registering user", registerError);
			throw registerError;
		}
	};

	const login = useCallback(
		async (publicKey: string): Promise<void> => {
			let user: User | null = null;

			console.log("logging in", publicKey);

			try {
				user = await getUserData(publicKey);
				if (!user) {
					throw new Error("User not found");
				}
				console.log("existingUser", user);
			} catch (error) {
				console.log("user not found", error);
				throw error;
			}

			if (user) {
				setUser(user);
				setIsAuthenticated(true);
				localStorage.setItem("user", JSON.stringify(user));

				if (user.role === Role.Landlord) {
					router.push("/landlord");
				} else {
					router.push("/invest");
				}
			} else {
				console.error("User is null after login attempt");
			}
		},
		[router]
	);


	const logout = () => {
		setIsAuthenticated(false);
		setUser(null);
		localStorage.removeItem("user");

		if (pathname !== "/") {
			router.push("/");
		}
	};

	useEffect(() => {
		const user = localStorage.getItem("user");
		if (user) {
			setUser(JSON.parse(user));
			setIsAuthenticated(true);
		}
	}, []);

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, user, login, register, logout }}
		>
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
