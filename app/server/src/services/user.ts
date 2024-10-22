import { supabase } from "../controllers/rpcController";
import { createUserWallet } from "../utils/walletUtils";

interface RegisterUserParams {
    name: string;
    email: string;
}

interface RegisterUserResponse {
    message: string;
    pubkey: string;
}

export const registerUser = async ({
    name,
    email,
}: RegisterUserParams): Promise<RegisterUserResponse> => {
    if (!name || !email) {
        throw new Error("Name and email are required");
    }

    const { pubkey, encryptedPrivateKey } = await createUserWallet();

    const { error } = await supabase
        .from("users")
        .insert([
            { name, email, pubkey, encrypted_private_key: encryptedPrivateKey },
        ]);

    if (error) {
        throw new Error(error.message);
    }

    return { message: "User registered successfully", pubkey };
};

export const loginUser = async (email: string, password: string) => {
    throw new Error("Login functionality not implemented yet");
};

export const updateProfile = async (userId: string, profileData: any) => {
    throw new Error("Update profile functionality not implemented yet");
};
