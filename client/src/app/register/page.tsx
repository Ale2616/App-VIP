"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Loader2, Eye, EyeOff, ArrowRight, UserPlus, Mail, KeyRound, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});
type RegisterFormData = z.infer<typeof registerSchema>;

function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute -top-40 -right-40 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" animate={{ scale:[1.2,1,1.2], opacity:[.4,.6,.4] }} transition={{ duration:9, repeat:Infinity, ease:"easeInOut" }} />
      <motion.div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" animate={{ scale:[1,1.2,1], opacity:[.3,.5,.3] }} transition={{ duration:11, repeat:Infinity, ease:"easeInOut" }} />
      <motion.div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" animate={{ scale:[1,1.4,1], opacity:[.2,.4,.2] }} transition={{ duration:14, repeat:Infinity, ease:"easeInOut" }} />
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "Débil", color: "bg-red-500" };
    if (score <= 2) return { level: 2, label: "Regular", color: "bg-yellow-500" };
    if (score <= 3) return { level: 3, label: "Buena", color: "bg-blue-500" };
    return { level: 4, label: "Fuerte", color: "bg-emerald-500" };
  };
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i=>(
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i<=strength.level ? strength.color : "bg-slate-700"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-500">{strength.label}</p>
    </div>
  );
}

export default function RegisterPage() {
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register: registerField, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const password = watch("password");

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      setIsSuccess(true);
      toast.success("¡Cuenta creada exitosamente!");
    } catch (error: any) {
      toast.error(error?.message || "Error al registrarse");
    }
  }, [registerMutation]);

  const features = [
    { icon: UserPlus, text: "Registro rápido" },
    { icon: Mail, text: "Verificación email" },
    { icon: KeyRound, text: "Seguridad avanzada" },
  ];

  const ringStyle = (field: string) => ({
    boxShadow: focusedField === field ? "0 0 0 2px rgba(192,132,252,0.4)" : "none",
    transition: "box-shadow 0.2s ease",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundOrbs />
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }} className="w-full max-w-md relative z-10">
        <Card className="w-full bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150 border-slate-800/50 shadow-2xl shadow-fuchsia-500/10">
          <CardHeader className="text-center pb-2">
            <div className="mb-4 flex justify-center">
              <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl shadow-lg shadow-fuchsia-500/30 relative">
                <Bot className="w-8 h-8 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Crear Cuenta</CardTitle>
            <CardDescription className="text-slate-400 mt-2">Ingresa tus datos para comenzar</CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div key="success" initial={{ opacity:0 }} animate={{ opacity:1 }} className="py-12 flex flex-col items-center gap-3 text-emerald-400">
                  <CheckCircle className="w-16 h-16" />
                  <p className="text-xl font-semibold">¡Cuenta creada!</p>
                  <p className="text-sm text-slate-400">Redirigiendo al inicio...</p>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-white flex items-center gap-2">👤 Nombre</Label>
                    <div className="rounded-lg" style={ringStyle("name")}>
                      <Input id="register-name" type="text" placeholder="Juan Pérez" {...registerField("name")} onFocus={()=>setFocusedField("name")} onBlur={()=>setFocusedField(null)} className="bg-slate-900/50 border-slate-800 text-white transition-colors focus:border-fuchsia-500/50" aria-invalid={!!errors.name} />
                    </div>
                    {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
                  </div>
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white flex items-center gap-2">📧 Correo Electrónico</Label>
                    <div className="rounded-lg" style={ringStyle("email")}>
                      <Input id="register-email" type="email" placeholder="tu@correo.com" {...registerField("email")} onFocus={()=>setFocusedField("email")} onBlur={()=>setFocusedField(null)} className="bg-slate-900/50 border-slate-800 text-white transition-colors focus:border-fuchsia-500/50" aria-invalid={!!errors.email} />
                    </div>
                    {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                  </div>
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white flex items-center gap-2">🔒 Contraseña</Label>
                    <div className="rounded-lg relative" style={ringStyle("password")}>
                      <Input id="register-password" type={showPassword?"text":"password"} placeholder="••••••••" {...registerField("password")} onFocus={()=>setFocusedField("password")} onBlur={()=>setFocusedField(null)} className="bg-slate-900/50 border-slate-800 text-white pr-10 transition-colors focus:border-fuchsia-500/50" aria-invalid={!!errors.password} />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                    {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                  </div>

                  {/* SUBMIT — STATIC BUTTON — NO translate, NO scale, NO magnetic effect */}
                  <button id="register-submit-btn" type="submit" disabled={registerMutation.isPending} className="w-full h-12 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 hover:from-fuchsia-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer">
                    <span className="flex items-center justify-center gap-2">
                      {registerMutation.isPending ? (<><Loader2 className="h-5 w-5 animate-spin"/>Creando cuenta...</>) : (<>Crear Cuenta <ArrowRight className="h-5 w-5"/></>)}
                    </span>
                  </button>

                  {/* Features */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    {features.map(f=>(
                      <div key={f.text} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <f.icon className="w-3 h-3 text-emerald-500"/>{f.text}
                      </div>
                    ))}
                  </div>

                  {/* Login link */}
                  <p className="text-center text-sm text-slate-400">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 transition-colors">Inicia sesión</Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
