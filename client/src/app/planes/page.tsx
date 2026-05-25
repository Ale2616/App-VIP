"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import {
  Crown,
  Sparkles,
  Shield,
  Zap,
  Download,
  Lock,
  Check,
  Star,
  Rocket,
  Gamepad2,
  ArrowLeft,
  MessageCircle,
  Monitor,
} from "lucide-react";

const WHATSAPP_NUMBER = "573115397930";

const plans = [
  {
    id: "free",
    name: "Gratis",
    price: "$0",
    period: "para siempre",
    description: "Acceso básico al catálogo de aplicaciones y juegos.",
    gradient: "from-slate-600 to-slate-700",
    borderColor: "border-slate-700/50",
    glowColor: "shadow-slate-500/5",
    iconBg: "from-slate-500 to-slate-600",
    icon: Download,
    features: [
      { text: "Catálogo completo de apps", included: true },
      { text: "Descargas con publicidad", included: true },
      { text: "Actualizaciones básicas", included: true },
      { text: "Enlaces directos", included: false },
      { text: "Mods exclusivos", included: false },
      { text: "Juegos de PC", included: false },
      { text: "Peticiones directas", included: false },
    ],
    cta: "Plan Actual",
    ctaStyle: "bg-slate-700 text-slate-300 cursor-default",
    popular: false,
  },
  {
    id: "vip",
    name: "VIP Premium",
    price: "$4.99",
    period: "/mes",
    description: "Enlaces directos, cero publicidad y mods exclusivos.",
    gradient: "from-purple-500 to-fuchsia-600",
    borderColor: "border-purple-500/40",
    glowColor: "shadow-purple-500/20",
    iconBg: "from-purple-500 to-fuchsia-500",
    icon: Crown,
    features: [
      { text: "Todo del plan Gratis", included: true },
      { text: "Enlaces directos sin publicidad", included: true },
      { text: "Mods y APKs exclusivos", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Actualizaciones anticipadas", included: true },
      { text: "Juegos de PC", included: false },
      { text: "Peticiones directas", included: false },
    ],
    cta: "Obtener VIP Premium",
    ctaStyle:
      "bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/25",
    popular: true,
  },
  {
    id: "elite",
    name: "VIP Élite",
    price: "$9.99",
    period: "/mes",
    description:
      "Acceso total: PC, peticiones y contenido ilimitado.",
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/40",
    glowColor: "shadow-amber-500/20",
    iconBg: "from-amber-500 to-orange-500",
    icon: Rocket,
    features: [
      { text: "Todo del plan VIP Premium", included: true },
      { text: "Juegos de PC completos", included: true },
      { text: "Software de PC premium", included: true },
      { text: "Peticiones directas al equipo", included: true },
      { text: "Acceso beta a nuevas apps", included: true },
      { text: "Badge Élite en tu perfil", included: true },
      { text: "Canal privado exclusivo", included: true },
    ],
    cta: "Obtener VIP Élite",
    ctaStyle:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25",
    popular: false,
  },
];

export default function PlanesPage() {
  const { isAuthenticated, profile } = useAuthStore();
  const userRole = profile?.role || "user";

  const handlePlanClick = (planId: string) => {
    if (planId === "free") return;

    const planLabel = planId === "vip" ? "VIP Premium" : "VIP Élite";
    const message = encodeURIComponent(
      `Hola, quiero ser ${planLabel} en App VIP 🚀`
    );
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      "_blank"
    );
  };

  const getCtaLabel = (planId: string) => {
    if (planId === "free") {
      if (!isAuthenticated) return "Plan Actual";
      return "Plan Actual";
    }
    if (planId === "vip" && (userRole === "vip" || userRole === "elite" || userRole === "admin"))
      return "✓ Activo";
    if (planId === "elite" && (userRole === "elite" || userRole === "admin"))
      return "✓ Activo";
    return plans.find((p) => p.id === planId)?.cta || "Obtener";
  };

  const isDisabled = (planId: string) => {
    if (planId === "free") return true;
    if (planId === "vip" && ["vip", "elite", "admin"].includes(userRole)) return true;
    if (planId === "elite" && ["elite", "admin"].includes(userRole)) return true;
    return false;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10 group"
          >
            <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 group-hover:border-purple-500/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Volver al catálogo</span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Planes de Membresía</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Elige tu Plan
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Desbloquea contenido exclusivo, descargas directas sin publicidad y mucho más con nuestros planes VIP.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const disabled = isDisabled(plan.id);
            const label = getCtaLabel(plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`relative group ${plan.popular ? "md:-translate-y-4" : ""}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-purple-500/30 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      MÁS POPULAR
                    </div>
                  </div>
                )}

                {/* Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />

                {/* Card */}
                <div
                  className={`relative bg-slate-900/80 backdrop-blur-xl border-2 ${plan.borderColor} rounded-2xl p-7 h-full flex flex-col transition-all duration-300 group-hover:border-opacity-80 ${plan.glowColor} group-hover:shadow-2xl`}
                >
                  {/* Icon + Title */}
                  <div className="mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.iconBg} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-slate-400">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <div className="mt-0.5 p-0.5 rounded-full bg-emerald-500/20">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="mt-0.5 p-0.5 rounded-full bg-slate-700/50">
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                          </div>
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? "text-slate-300" : "text-slate-600 line-through"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePlanClick(plan.id)}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      disabled
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : plan.ctaStyle + " active:scale-[0.97] cursor-pointer"
                    }`}
                  >
                    {!disabled && plan.id !== "free" && (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    {label}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ / Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              ¿Cómo funciona?
            </h3>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <p className="text-sm text-slate-300 font-medium">Elige tu plan</p>
                <p className="text-xs text-slate-500">Selecciona VIP Premium o Élite según tus necesidades.</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <p className="text-sm text-slate-300 font-medium">Contáctanos</p>
                <p className="text-xs text-slate-500">Escríbenos por WhatsApp para procesar tu pago de forma segura.</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <p className="text-sm text-slate-300 font-medium">Activa tu VIP</p>
                <p className="text-xs text-slate-500">Recibe acceso inmediato a todo el contenido exclusivo.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
