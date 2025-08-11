'use client';

import { useState, useContext } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import AuthContext from "@/providers/auth-provider";

function LoginPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error('LoginPage must be used within an AuthProvider');
    }

    const { login, loginWithGoogle } = authContext;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        // await setPersistence(auth, persistence);

        try {
            await login(email, password);
            toast.success("Logged in successfully!");
        } catch (error) {
            console.error("Login error:", error);

            let errorMessage = "Invalid email or password. Please try again.";

            // Check if it's an axios error with response data
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || "Invalid email or password. Please try again.";
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            setError(errorMessage);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-lg shadow-lg p-8"
            >
                <div className="bg-white rounded-2xl  space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Welcome Back
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Please enter your email and password to continue.
                        </p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="text-red-600 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="prodgain@gmail.com"
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                autoComplete="username"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setPassword(e.target.value);
                                        setError(null);
                                    }}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>


                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2" >
                                <Checkbox
                                    id="remember"
                                // checked={rememberMe}
                                // onCheckedChange={(checked) => setRememberMe(!!checked)}
                                />
                                <Label htmlFor="remember" className="text-sm">
                                    Remember me
                                </Label>
                            </div>
                            <span className="text-sm text-gray-400">
                                Forgot password?
                            </span>
                        </div>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm text-gray-500 uppercase">
                            <span className="bg-white px-2">Or continue with</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            type="button"
                            onClick={async () => {
                                try {
                                    await loginWithGoogle();
                                    toast.success("Logged in with Google successfully!");
                                } catch (error) {
                                    console.error("Google login error:", error);

                                    // Check if it's an axios error with response data
                                    if (error && typeof error === 'object' && 'response' in error) {
                                        const axiosError = error as any;
                                        const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || "Failed to login with Google. Please try again.";
                                        toast.error(errorMessage);
                                    } else if (error instanceof Error) {
                                        toast.error(error.message);
                                    } else {
                                        toast.error("Failed to login with Google. Please try again.");
                                    }
                                }
                            }}
                        >
                            <Mail size={18} />
                            <span>Google</span>
                        </Button>
                        <Button variant="outline" className="w-full cursor-not-allowed">
                            <Github size={18} />
                            <span>GitHub</span>
                        </Button>
                    </div>
                    <div className="text-center text-sm text-gray-500">
                        Don't have an account?{" "}
                        <Link href="/auth/register" className="text-black hover:underline">
                            Sign up
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default LoginPage


