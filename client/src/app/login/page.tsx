"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Loader2, Eye, EyeOff, ArrowRight, Shield, Zap, Lock } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
type LoginFormData = z.infer<typeof loginSchema>;

function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 rounded-full blur-3xl" animate={{ scale:[1,1.3,1], opacity:[.3,.5,.3] }} transition={{ duration:12, repeat:Infinity, ease:"easeInOut" }} />
      <motion.div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/25 to-cyan-500/25 rounded-full blur-3xl" animate={{ scale:[1.2,1,1.2], opacity:[.4,.6,.4] }} transition={{ duration:15, repeat:Infinity, ease:"easeInOut" }} />
      <motion.div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-3xl" animate={{ scale:[1,1.4,1], opacity:[.2,.4,.2] }} transition={{ duration:18, repeat:Infinity, ease:"easeInOut" }} />
    </div>
  );
}

export default function LoginPage() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      await login.mutateAsync(data);
      setIsSuccess(true);
      toast.success("¡Inicio de sesión exitoso!");
    } catch (error: any) {
      toast.error(error?.message || "Error al iniciar sesión");
    }
  }, [login]);

  const features = [
    { icon: Shield, text: "Conexión segura" },
    { icon: Zap, text: "Acceso instantáneo" },
    { icon: Lock, text: "Datos protegidos" },
  ];

  const ringStyle = (field: string) => ({
    boxShadow: focusedField === field ? "0 0 0 2px rgba(168,85,247,0.4)" : "none",
    transition: "box-shadow 0.2s ease",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundOrbs />
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }} className="w-full max-w-md relative z-10">
        <Card className="w-full bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150 border-slate-800/50 shadow-2xl shadow-purple-500/10">
          <CardHeader className="text-center pb-2">
            <div className="mb-4 flex justify-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl shadow-lg shadow-purple-500/30 relative">
                <Bot className="w-8 h-8 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Bienvenido</CardTitle>
            <CardDescription className="text-slate-400 mt-2">Ingresa tus credenciales para continuar</CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div key="success" initial={{ opacity:0 }} animate={{ opacity:1 }} className="py-12 text-center text-emerald-400 font-medium">✅ ¡Redirigiendo...</motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white flex items-center gap-2">📧 Correo Electrónico</Label>
                    <div className="rounded-lg" style={ringStyle("email")}>
                      <Input id="login-email" type="email" placeholder="tu@correo.com" {...register("email")} onFocus={()=>setFocusedField("email")} onBlur={()=>setFocusedField(null)} className="bg-slate-900/50 border-slate-800 text-white transition-colors focus:border-purple-500/50" aria-invalid={!!errors.email} />
                    </div>
                    {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                  </div>
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white flex items-center gap-2">🔒 Contraseña</Label>
                    <div className="rounded-lg relative" style={ringStyle("password")}>
                      <Input id="login-password" type={showPassword?"text":"password"} placeholder="••••••••" {...register("password")} onFocus={()=>setFocusedField("password")} onBlur={()=>setFocusedField(null)} className="bg-slate-900/50 border-slate-800 text-white pr-10 transition-colors focus:border-purple-500/50" aria-invalid={!!errors.password} />
                      <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                  </div>

                  {/* SUBMIT — STATIC BUTTON — NO translate, NO scale, NO magnetic effect */}
                  <button id="login-submit-btn" type="submit" disabled={login.isPending} className="w-full h-12 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 text-white font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer">
                    <span className="flex items-center justify-center gap-2">
                      {login.isPending ? (<><Loader2 className="h-5 w-5 animate-spin"/>Iniciando sesión...</>) : (<>Iniciar Sesión <ArrowRight className="h-5 w-5"/></>)}
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

                  {/* Register link */}
                  <p className="text-center text-sm text-slate-400">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors">Regístrate</Link>
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
