"use client";

import { useState } from "react";
import { MessageSquare, X, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AppRequestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !email.trim()) {
      toast.error("Por favor llena todos los campos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("app_requests").insert({
        app_name: appName.trim(),
        email: email.trim(),
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("¡Solicitud enviada con éxito!");
      setAppName("");
      setEmail("");
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting request:", err);
      toast.error("Error al enviar la solicitud: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-xs shadow-[0_8px_30px_rgba(79,70,229,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        <MessageSquare className="w-4 h-4" />
        <span>¿Buscas una App?</span>
      </button>

      {/* Modal Backdrop & Ventana */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 transform scale-100 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-850 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/45 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  ¡Solicitud Recibida!
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Hemos registrado tu pedido. Te notificaremos pronto.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                    Solicitar una Aplicación
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    ¿No encuentras el juego o app que necesitas? Pídelo aquí y lo subiremos para ti.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                      Nombre de la App / Juego
                    </label>
                    <input
                      type="text"
                      required
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Ej. Adobe Photoshop Mod, GTA V Mobile..."
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-55 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5">
                      Tu correo electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-55 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-750 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-xs shadow-md transition-all cursor-pointer dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Solicitud</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
