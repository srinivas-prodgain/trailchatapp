'use client';

import { useState, useContext } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import AuthContext from "@/providers/auth-provider";
import { toast } from "sonner";

import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((value) => value, {
        message: "You must accept the Terms and Conditions"
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});



type FormErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    termsAccepted?: string;
};

function Register() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error('RegisterPage must be used within an AuthProvider');
    }
    const { register, loginWithGoogle } = authContext;

    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const onClickingRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = {
            name,
            email,
            password,
            confirmPassword,
            termsAccepted
        };

        const result = registerSchema.safeParse(formData);

        if (!result.success) {
            const errors: FormErrors = {};
            // console.error("Validation errors:", result.error.issues);
            result.error.issues.forEach((err: any) => {
                const fieldName = err.path[0] as keyof FormErrors;
                errors[fieldName] = err.message;
            });
            setFormErrors(errors);
            toast.error("Please fix the errors in the form.");
            return;
        }

        try {
            await register(name, email, password);
            toast.success("Registration successful! Please check your email.");
            // alert("Registration successful! Please check your email.");
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setTermsAccepted(false);
            setFormErrors({});
        } catch (err) {
            console.error("Registration failed:", err);

            // Check if it's an axios error with response data
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as any;
                const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || "Registration failed. Please try again.";
                toast.error(errorMessage);
            } else if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error("Registration failed. Please try again.");
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen  p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
            >
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hey there!</h1>
                    <p className="text-muted-foreground text-sm">
                        Please enter your email and password to register
                    </p>
                </div>
                <form className="mt-6 space-y-4" onSubmit={onClickingRegister}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Sai Teja"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            autoComplete="name"
                            required
                        />
                        {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="prodgain@gmail.com"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                        {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formErrors.confirmPassword && (
                            <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                        />
                        <Label htmlFor="terms">
                            I accept the{" "}
                            <a href="#" className="text-black hover:underline">
                                Terms and Conditions
                            </a>
                        </Label>
                    </div>
                    {formErrors.termsAccepted && (
                        <p className="text-sm text-red-500">{formErrors.termsAccepted}</p>
                    )}
                    <Button
                        type="submit"
                        className="w-full cursor-pointer bg-black text-white hover:bg-gray-800 transition-colors duration-200"
                    >
                        Register
                    </Button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm text-gray-500 uppercase">
                        <span className="bg-white px-2">Or continue with</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={async () => {
                            try {
                                await loginWithGoogle();
                                toast.success("Registered with Google successfully!");
                            } catch (error) {
                                console.error("Google registration error:", error);

                                // Check if it's an axios error with response data
                                if (error && typeof error === 'object' && 'response' in error) {
                                    const axiosError = error as any;
                                    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || "Failed to register with Google. Please try again.";
                                    toast.error(errorMessage);
                                } else if (error instanceof Error) {
                                    toast.error(error.message);
                                } else {
                                    toast.error("Failed to register with Google. Please try again.");
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
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-black hover:underline">
                        Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default Register;