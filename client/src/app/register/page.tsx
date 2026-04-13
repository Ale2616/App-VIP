"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Loader2, Eye, EyeOff, ArrowRight, CheckCircle, UserPlus, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Animated background orbs
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -30, 0],
          y: [0, 20, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 40, 0],
          y: [0, -30, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, -180, -360],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Floating particles
function FloatingParticles() {
  const particles = Array.from({ length: 25 }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/15 rounded-full"
          style={{
            left: `${(i * 41 + 17) % 100}%`,
            top: `${(i * 59 + 11) % 100}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 3 + (i % 5),
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Magnetic button with ripple effect
function MagneticButton({ children, onClick, disabled, className }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      type="submit"
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      onClick={onClick}
      disabled={disabled}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

// Success checkmark animation
function SuccessAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col items-center justify-center gap-3 text-emerald-400"
    >
      <motion.div
        className="w-16 h-16 border-3 border-emerald-400 rounded-full flex items-center justify-center"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <CheckCircle className="w-10 h-10" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-xl font-semibold">¡Cuenta creada!</p>
        <p className="text-sm text-slate-400 mt-1">Redirigiendo al inicio...</p>
      </motion.div>
    </motion.div>
  );
}

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
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
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-1"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength.level ? strength.color : "bg-slate-700"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i <= strength.level ? 1 : 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">{strength.label}</p>
    </motion.div>
  );
}

export default function RegisterPage() {
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const password = watch("password");

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    try {
      await register.mutateAsync(data);
      setIsSuccess(true);
      toast.success("¡Cuenta creada exitosamente!");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Error al registrarse";
      toast.error(msg);
    }
  }, [register]);

  const features = [
    { icon: UserPlus, text: "Registro rápido" },
    { icon: Mail, text: "Verificación email" },
    { icon: KeyRound, text: "Seguridad avanzada" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundOrbs />
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="w-full bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150 border-slate-800/50 shadow-2xl shadow-fuchsia-500/10">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mb-4 flex justify-center"
            >
              <motion.div
                className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl shadow-lg shadow-fuchsia-500/30 relative"
                whileHover={{ rotate: -10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Bot className="w-8 h-8 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold text-white bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Crear Cuenta
              </CardTitle>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription className="text-slate-400 mt-2">
                Ingresa tus datos para comenzar
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12"
                >
                  <SuccessAnimation />
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Name Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name" className="text-white flex items-center gap-2">
                      <motion.span
                        animate={{ scale: focusedField === "name" ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        👤
                      </motion.span>
                      Nombre
                    </Label>
                    <motion.div
                      animate={{
                        boxShadow: focusedField === "name"
                          ? "0 0 0 2px rgba(192, 132, 252, 0.4)"
                          : "0 0 0 0px rgba(192, 132, 252, 0)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-lg"
                    >
                      <Input
                        id="name"
                        type="text"
                        placeholder="Juan Pérez"
                        {...registerField("name")}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        className="bg-slate-900/50 border-slate-800 text-white transition-all duration-200 focus:border-fuchsia-500/50"
                        aria-invalid={!!errors.name}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="text-sm text-red-400"
                        >
                          {errors.name.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <motion.span
                        animate={{ scale: focusedField === "email" ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        📧
                      </motion.span>
                      Correo Electrónico
                    </Label>
                    <motion.div
                      animate={{
                        boxShadow: focusedField === "email"
                          ? "0 0 0 2px rgba(192, 132, 252, 0.4)"
                          : "0 0 0 0px rgba(192, 132, 252, 0)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-lg"
                    >
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        {...registerField("email")}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className="bg-slate-900/50 border-slate-800 text-white transition-all duration-200 focus:border-fuchsia-500/50"
                        aria-invalid={!!errors.email}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="text-sm text-red-400"
                        >
                          {errors.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-white flex items-center gap-2">
                      <motion.span
                        animate={{ scale: focusedField === "password" ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        🔒
                      </motion.span>
                      Contraseña
                    </Label>
                    <motion.div
                      animate={{
                        boxShadow: focusedField === "password"
                          ? "0 0 0 2px rgba(192, 132, 252, 0.4)"
                          : "0 0 0 0px rgba(192, 132, 252, 0)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-lg relative"
                    >
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...registerField("password")}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className="bg-slate-900/50 border-slate-800 text-white pr-10 transition-all duration-200 focus:border-fuchsia-500/50"
                        aria-invalid={!!errors.password}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={showPassword ? "off" : "on"}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                    <PasswordStrength password={password} />
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="text-sm text-red-400"
                        >
                          {errors.password.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <MagneticButton
                      disabled={register.isPending}
                      className="w-full h-12 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 hover:from-fuchsia-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {register.isPending ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-5 w-5" />
                            </motion.div>
                            Creando cuenta...
                          </>
                        ) : (
                          <>
                            Crear Cuenta
                            <motion.span
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="h-5 w-5" />
                            </motion.span>
                          </>
                        )}
                      </span>
                    </MagneticButton>
                  </motion.div>

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-4 pt-2"
                  >
                    {features.map((feature, i) => (
                      <motion.div
                        key={feature.text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-1.5 text-xs text-slate-500"
                      >
                        <feature.icon className="w-3 h-3 text-emerald-500" />
                        {feature.text}
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Login Link */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-sm text-slate-400"
                  >
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 relative inline-block group">
                      <span className="relative">
                        Inicia sesión
                        <motion.span
                          className="absolute bottom-0 left-0 w-0 h-0.5 bg-fuchsia-400 group-hover:w-full"
                          transition={{ duration: 0.3 }}
                          whileHover={{ width: "100%" }}
                        />
                      </span>
                    </Link>
                  </motion.p>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Bottom glow effect */}
        <motion.div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-t from-fuchsia-500/10 to-transparent rounded-full blur-3xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>
    </main>
  );
}
