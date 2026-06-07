"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Check, Pencil, Loader2, Crown, Trash, Users, Calendar, Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface MembresiasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function MembresiasModal({ isOpen, onClose, onSaved }: MembresiasModalProps) {
  const [activeTab, setActiveTab] = useState<"usuarios" | "planes">("usuarios");
  const [plans, setPlans] = useState<any[]>([]);
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);

  // States for Time Management
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [durationOption, setDurationOption] = useState<"1_mes" | "1_anio" | "personalizado">("1_mes");
  const [membershipType, setMembershipType] = useState<string>("VIP_ESTANDAR");
  const [expiryDate, setExpiryDate] = useState<string>("");

  // States for Plans Configuration
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planFeatures, setPlanFeatures] = useState<Array<{ text: string; included: boolean }>>([]);

  const fetchVipUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["VIP_PREMIUM", "VIP_ESTANDAR", "elite", "vip"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVipUsers(data || []);
    } catch (err: any) {
      console.error("Error loading VIP users:", err);
      toast.error("Error cargando usuarios VIP");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*");
      if (error) throw error;
      if (data) {
        const sorted = data.sort((a, b) => {
          const order: Record<string, number> = { free: 1, vip: 2, elite: 3 };
          return (order[a.id] || 99) - (order[b.id] || 99);
        });
        setPlans(sorted);
      }
    } catch (err: any) {
      console.error("Error loading plans:", err);
      toast.error("Error cargando planes");
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVipUsers();
      fetchPlans();
    }
  }, [isOpen]);

  // Manejar el cálculo automático de fechas al seleccionar duración
  useEffect(() => {
    if (!selectedUser) return;
    const now = new Date();
    
    if (durationOption === "1_mes") {
      const target = new Date();
      target.setDate(now.getDate() + 30);
      setExpiryDate(target.toISOString().substring(0, 16)); // Formato datetime-local YYYY-MM-DDThh:mm
    } else if (durationOption === "1_anio") {
      const target = new Date();
      target.setDate(now.getDate() + 365);
      setExpiryDate(target.toISOString().substring(0, 16));
    }
  }, [durationOption, selectedUser]);

  if (!isOpen) return null;

  // Iniciar la edición de tiempos para un usuario VIP
  const startManageTime = (user: any) => {
    setSelectedUser(user);
    setMembershipType(user.role === "elite" || user.role === "VIP_PREMIUM" ? "VIP_PREMIUM" : "VIP_ESTANDAR");
    setDurationOption("1_mes");
    
    if (user.membership_expiry) {
      try {
        const expiry = new Date(user.membership_expiry);
        setExpiryDate(expiry.toISOString().substring(0, 16));
        setDurationOption("personalizado");
      } catch {
        const target = new Date();
        target.setDate(target.getDate() + 30);
        setExpiryDate(target.toISOString().substring(0, 16));
      }
    } else {
      const target = new Date();
      target.setDate(target.getDate() + 30);
      setExpiryDate(target.toISOString().substring(0, 16));
    }
  };

  // Guardar la membresía de usuario modificada en Supabase
  const handleSaveUserMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);

    try {
      const startIso = new Date().toISOString();
      const expiryIso = new Date(expiryDate).toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({
          role: membershipType,
          membership_type: membershipType,
          membership_start: startIso,
          membership_expiry: expiryIso,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("Membresía actualizada");
      setSelectedUser(null);
      fetchVipUsers();
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error("Error al actualizar la membresía: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Iniciar la edición de la configuración de un plan
  const startEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    // Remover símbolos y textos para dejar solo valor numérico
    setPlanPrice(plan.price.replace(/[^0-9]/g, ""));
    setPlanDescription(plan.description);

    let parsedFeatures: any[] = [];
    if (Array.isArray(plan.features)) {
      parsedFeatures = plan.features;
    } else if (typeof plan.features === "string") {
      try {
        parsedFeatures = JSON.parse(plan.features);
      } catch {
        parsedFeatures = plan.features.split(",").map((f: string) => ({ text: f.trim(), included: true }));
      }
    }
    setPlanFeatures(parsedFeatures);
  };

  const handleAddFeature = () => {
    setPlanFeatures([...planFeatures, { text: "", included: true }]);
  };

  const handleRemoveFeature = (index: number) => {
    setPlanFeatures(planFeatures.filter((_, idx) => idx !== index));
  };

  const handleFeatureChange = (index: number, text: string) => {
    const updated = [...planFeatures];
    updated[index].text = text;
    setPlanFeatures(updated);
  };

  const handleFeatureToggle = (index: number) => {
    const updated = [...planFeatures];
    updated[index].included = !updated[index].included;
    setPlanFeatures(updated);
  };

  // Guardar cambios en el plan en la tabla subscription_plans
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);

    let formattedPrice = planPrice;
    // Dar formato COP (Ej: 150.000)
    if (/^\d+$/.test(planPrice)) {
      const parsed = parseInt(planPrice, 10);
      formattedPrice = `$${parsed.toLocaleString("es-CO")} COP`;
    }

    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name: planName,
          price: formattedPrice,
          description: planDescription,
          features: JSON.stringify(planFeatures),
        })
        .eq("id", editingPlan.id);

      if (error) throw error;

      toast.success("Plan guardado en Supabase");
      setEditingPlan(null);
      fetchPlans();
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error("Error al guardar plan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 text-gray-900 dark:text-white transition-colors">
        
        {/* Botón cerrar modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-650 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/20" /> Módulo de Membresías VIP
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Administra suscripciones, controla las fechas de expiración de tus clientes VIP y ajusta los beneficios.
          </p>
        </div>

        {/* Tabs de Navegación del Modal */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-800/60 pb-3">
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "usuarios"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-750"
            }`}
          >
            <Users className="w-4 h-4" /> Control de Tiempos VIP
          </button>
          <button
            onClick={() => setActiveTab("planes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "planes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-750"
            }`}
          >
            <Settings className="w-4 h-4" /> Configuración de Planes (COP)
          </button>
        </div>

        {/* TAB 1: LISTA Y CONTROL DE TIEMPOS VIP */}
        {activeTab === "usuarios" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300">Clientes con Membresía Activa</h3>
              <span className="text-[11px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">
                {vipUsers.length} VIPs
              </span>
            </div>

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
                <p className="text-xs text-slate-500">Cargando base de datos Supabase...</p>
              </div>
            ) : vipUsers.length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-950/20">
                <Users className="w-10 h-10 text-gray-400 dark:text-slate-650 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400">Sin usuarios VIP activos</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Asigna roles VIP en la sección de Usuarios primero.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-950/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Plan / Rol</th>
                      <th className="px-4 py-3">Inicio</th>
                      <th className="px-4 py-3">Vence</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-slate-800/50 text-xs">
                    {vipUsers.map((user) => {
                      const startText = user.membership_start ? new Date(user.membership_start).toLocaleDateString("es-ES") : "N/A";
                      const expiryText = user.membership_expiry ? new Date(user.membership_expiry).toLocaleDateString("es-ES") : "Sin límites";
                      const isExpired = user.membership_expiry ? new Date(user.membership_expiry).getTime() < Date.now() : false;

                      return (
                        <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-850/40 transition-colors">
                          <td className="px-4 py-3 font-bold">{user.name || "Sin nombre"}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              user.role === "VIP_PREMIUM" || user.role === "elite"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            }`}>
                              {user.role === "VIP_PREMIUM" || user.role === "elite" ? "VIP Premium" : "VIP Estándar"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{startText}</td>
                          <td className="px-4 py-3">
                            <span className={isExpired ? "text-red-500 font-bold" : "text-gray-900 dark:text-slate-300 font-medium"}>
                              {expiryText} {isExpired && "(Expirado)"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              onClick={() => startManageTime(user)}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-750 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1" /> Gestionar Tiempo
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIGURACIÓN DE PLANES */}
        {activeTab === "planes" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300">Ajuste de Precios en COP y Beneficios</h3>

            {loadingPlans ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-purple-650" />
                <p className="text-xs text-slate-500">Cargando configuración de planes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  let featureList: any[] = [];
                  if (Array.isArray(plan.features)) {
                    featureList = plan.features;
                  } else if (typeof plan.features === "string") {
                    try {
                      featureList = JSON.parse(plan.features);
                    } catch {
                      featureList = [];
                    }
                  }

                  return (
                    <div
                      key={plan.id}
                      className="border border-gray-200 dark:border-slate-800 rounded-2xl p-5 bg-gray-50/50 dark:bg-slate-950/20 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-sm">{plan.name}</h4>
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">{plan.id}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{plan.description}</p>
                        <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mb-4">
                          {plan.price}
                        </div>

                        <div className="space-y-1.5 mb-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Beneficios:</p>
                          <ul className="space-y-1">
                            {featureList.map((feat: any, idx: number) => (
                              <li key={idx} className="text-[11px] text-gray-650 dark:text-slate-300 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{feat.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <Button
                        onClick={() => startEditPlan(plan)}
                        className="w-full flex items-center justify-center gap-1 bg-indigo-50 dark:bg-indigo-550/10 hover:bg-indigo-100 dark:hover:bg-indigo-550/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Configurar Plan
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBFORMULARIO 1: EDITAR TIEMPOS DE CLIENTE VIP */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleSaveUserMembership} className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-purple-500" /> Gestionar Tiempo de Membresía
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Establece el nivel y la expiración para <span className="font-bold text-gray-700 dark:text-white">{selectedUser.name || selectedUser.email}</span>.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Tipo de Membresía */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Nivel de Membresía
                    </label>
                    <select
                      value={membershipType}
                      onChange={(e) => setMembershipType(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-950 dark:text-white font-semibold cursor-pointer"
                    >
                      <option value="VIP_ESTANDAR">VIP Estándar</option>
                      <option value="VIP_PREMIUM">VIP Premium</option>
                    </select>
                  </div>

                  {/* Seleccionar Duración */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Duración de Membresía
                    </label>
                    <select
                      value={durationOption}
                      onChange={(e: any) => setDurationOption(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-950 dark:text-white font-semibold cursor-pointer"
                    >
                      <option value="1_mes">1 Mes (30 días)</option>
                      <option value="1_anio">1 Año (365 días)</option>
                      <option value="personalizado">Personalizado (Manual)</option>
                    </select>
                  </div>

                  {/* Edición de Fecha de Expiración (Automático / Manual) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Fecha de Expiración
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value);
                        setDurationOption("personalizado"); // Si edita manualmente, pasa a personalizado
                      }}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-905 dark:text-white cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-purple-650 hover:bg-purple-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md text-xs text-white"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUBFORMULARIO 2: EDITAR PRECIOS EN PLANES */}
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-655 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleSavePlan} className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Editar Configuración del Plan: {editingPlan.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Modifica el precio y la lista de beneficios que se guarda en Supabase.
                  </p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-750 dark:text-slate-300 mb-1.5">
                      Nombre del Plan
                    </label>
                    <input
                      type="text"
                      required
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-750 dark:text-slate-300 mb-1.5">
                      Precio en COP (Solo números, Ej: 150000)
                    </label>
                    <input
                      type="number"
                      required
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      placeholder="Ej. 150000"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-750 dark:text-slate-300 mb-1.5">
                      Descripción General
                    </label>
                    <input
                      type="text"
                      required
                      value={planDescription}
                      onChange={(e) => setPlanDescription(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                        Beneficios
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg border border-purple-500/25 transition-all cursor-pointer"
                      >
                        + Añadir Beneficio
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {planFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleFeatureToggle(idx)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              feature.included
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                                : "bg-red-500/15 border-red-500/30 text-red-500"
                            }`}
                          >
                            {feature.included ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                          <input
                            type="text"
                            required
                            value={feature.text}
                            onChange={(e) => handleFeatureChange(idx, e.target.value)}
                            placeholder="Describir beneficio..."
                            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md text-xs text-white"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    {saving ? "Guardando..." : "Guardar Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
