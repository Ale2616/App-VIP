"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, Clipboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function BulkUpload() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoFetchLogos, setAutoFetchLogos] = useState(false);
  const [realTimeScraping, setRealTimeScraping] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [log, setLog] = useState<Array<{ type: "success" | "error" | "warning"; message: string }>>([]);
  const [summaryList, setSummaryList] = useState<Array<{ name: string; status: "Sincronizado" | "Error" | "Omitido"; error?: string }>>([]);

  const getIconHorseUrl = (name: string, downloadUrl?: string) => {
    if (downloadUrl) {
      try {
        const url = new URL(downloadUrl);
        const parts = url.hostname.split(".");
        if (parts.length >= 2) {
          return `https://icon.horse/icon/${parts.slice(-2).join(".")}`;
        }
        return `https://icon.horse/icon/${url.hostname}`;
      } catch {
        // Fallback to name
      }
    }
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `https://icon.horse/icon/${cleanName || "example"}.com`;
  };

  const parseInstalls = (installsVal: any): string | null => {
    if (!installsVal) return null;
    let clean = String(installsVal).trim().toLowerCase();
    clean = clean.replace(/\+/g, "");
    if (clean.endsWith("k") || clean.endsWith("m") || clean.endsWith("b")) {
      const suffix = clean.slice(-1);
      const numPart = clean.slice(0, -1).trim();
      const num = parseFloat(numPart.replace(/,/g, "."));
      if (!isNaN(num)) {
        let multiplier = 1;
        if (suffix === "k") multiplier = 1000;
        if (suffix === "m") multiplier = 1000000;
        if (suffix === "b") multiplier = 1000000000;
        return String(Math.round(num * multiplier));
      }
    } else {
      return clean.replace(/[\.,\s]/g, "");
    }
    return clean;
  };

  const formatContentRating = (ratingRaw: string): string => {
    if (!ratingRaw) return "3+";
    const numMatch = ratingRaw.match(/\d+/);
    if (numMatch) {
      return `${numMatch[0]}+`;
    } else {
      const lower = ratingRaw.toLowerCase();
      if (lower.includes("everyone")) return "3+";
      if (lower.includes("teen")) return "12+";
      if (lower.includes("mature")) return "17+";
      if (lower.includes("adult")) return "18+";
      return ratingRaw;
    }
  };

  const handleImport = async () => {
    const rawText = inputText.trim();
    if (!rawText) {
      toast.error("Por favor ingresa un JSON válido");
      return;
    }

    setLoading(true);
    setLog([]);
    setSummaryList([]);
    setStatus("Analizando JSON...");

    let appsArray: any[] = [];
    try {
      appsArray = JSON.parse(rawText);
      if (!Array.isArray(appsArray)) {
        throw new Error("El JSON debe ser un array de objetos");
      }
    } catch (err: any) {
      setLog([{ type: "error", message: `Error de parsing: ${err.message}` }]);
      setStatus("Error en la validación del JSON");
      setLoading(false);
      toast.error("JSON inválido");
      return;
    }

    setStatus(`Iniciando importación masiva de ${appsArray.length} aplicaciones...`);

    const processedApps: any[] = [];

    for (let i = 0; i < appsArray.length; i++) {
      const app = appsArray[i];
      const appIdxStr = `#${i + 1}`;
      const appName = app.name || `App ${appIdxStr}`;
      
      // Validar campos mínimos
      if (!app.name || !app.download_url) {
        setLog(prev => [
          ...prev,
          { type: "warning", message: `Registro ${appIdxStr} ("${app.name || 'Sin nombre'}") omitirá validación completa pero requiere al menos 'name' y 'download_url'` }
        ]);
      }

      let scrapedData: any = null;

      if (realTimeScraping) {
        setStatus(`Sincronizando ${appName} (${i + 1}/${appsArray.length}) con Play Store...`);
        const queryTerm = app.name || app.download_url || "";
        if (queryTerm) {
          try {
            const res = await fetch("/api/admin/scraper", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ appId: queryTerm }),
            });
            const json = res.ok ? await res.json() : null;
            if (res.ok && json) {
              scrapedData = json;
              setLog(prev => [
                ...prev,
                { type: "success", message: `Play Store sincronizado con éxito para: "${appName}"` }
              ]);
            } else {
              const errText = json?.error || `HTTP error ${res.status}`;
              throw new Error(errText);
            }
          } catch (e: any) {
            console.error(e);
            setLog(prev => [
              ...prev,
              { type: "error", message: `Error en [${appName}]: ${e.message || String(e)}` }
            ]);
            setSummaryList(prev => [...prev, { name: appName, status: "Error", error: e.message || String(e) }]);
          }
        }
      }

      // Limpiar installs
      const cleanInstalls = scrapedData?.installs ? parseInstalls(scrapedData.installs) : parseInstalls(app.installs);

      // Lógica de logotipo
      let finalIconUrl = scrapedData?.icon || app.icon_url || app.image_url || null;
      if (autoFetchLogos && !finalIconUrl) {
        finalIconUrl = getIconHorseUrl(app.name || "", app.download_url);
      }

      const scoreValue = scrapedData?.score !== undefined && scrapedData?.score !== null 
        ? String(scrapedData.score) 
        : (app.score ? String(app.score) : null);

      const contentRatingValue = scrapedData?.contentRating 
        ? formatContentRating(scrapedData.contentRating) 
        : (app.content_rating || app.contentRating || null);

      const finalApp = {
        name: scrapedData?.title || app.name || "App Importada",
        description: scrapedData?.description || app.description || "Sin descripción",
        version: app.version || "1.0.0",
        category: app.category || "Aplicación",
        download_url: app.download_url || "",
        image_url: scrapedData?.screenshots?.[0] || app.image_url || "",
        icon_url: finalIconUrl,
        screenshots: scrapedData?.screenshots || (Array.isArray(app.screenshots) ? app.screenshots : []),
        download_options: Array.isArray(app.download_options) ? app.download_options : [],
        is_premium: app.is_premium === true || app.is_premium === "true",
        score: scoreValue,
        installs: cleanInstalls,
        mod: app.mod || null,
        content_rating: contentRatingValue,
        reviews: scrapedData?.reviews || app.reviews || null,
        ratings_histogram: scrapedData?.histogram || app.ratings_histogram || null,
        created_at: new Date().toISOString(),
      };

      processedApps.push({ item: finalApp, name: appName });
    }

    setStatus("Guardando aplicaciones en Supabase...");
    let savedCount = 0;

    for (const entry of processedApps) {
      try {
        const { error } = await supabase
          .from("applications")
          .insert(entry.item);

        if (error) throw error;
        
        savedCount++;
        setSummaryList(prev => {
          const alreadyLoggedError = prev.some(x => x.name === entry.name && x.status === "Error");
          if (alreadyLoggedError) return prev;
          return [...prev, { name: entry.name, status: realTimeScraping ? "Sincronizado" : "Omitido" }];
        });
      } catch (err: any) {
        console.error(err);
        setLog(prev => [
          ...prev,
          { type: "error", message: `Error al insertar "${entry.name}": ${err.message || JSON.stringify(err)}` }
        ]);
        setSummaryList(prev => {
          const exists = prev.some(x => x.name === entry.name);
          if (exists) {
            return prev.map(x => x.name === entry.name ? { ...x, status: "Error", error: err.message } : x);
          }
          return [...prev, { name: entry.name, status: "Error", error: err.message }];
        });
      }
    }

    setStatus("Importación finalizada.");
    if (savedCount > 0) {
      setLog(prev => [
        ...prev,
        { type: "success", message: `Importación masiva completada: ${savedCount} de ${appsArray.length} aplicaciones guardadas.` }
      ]);
      toast.success("¡Importación masiva JSON completada!");
    } else {
      toast.error("Ninguna aplicación pudo ser guardada");
    }
    setLoading(false);
  };

  const loadExample = () => {
    const example = [
      {
        "name": "Spotify Premium Mod",
        "description": "Escucha música sin anuncios y descarga playlists de forma ilimitada.",
        "version": "8.8.96.5",
        "category": "Aplicación",
        "download_url": "https://spotify.com/download",
        "image_url": "",
        "is_premium": true,
        "score": "4.7",
        "installs": "50M"
      },
      {
        "name": "Minecraft Bedrock Edition",
        "description": "Construye mundos infinitos y juega con amigos en multiplataforma.",
        "version": "1.20.50",
        "category": "Juegos",
        "download_url": "https://minecraft.net",
        "image_url": "https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover_art1.png",
        "is_premium": false,
        "score": "4.5",
        "installs": "100.000"
      }
    ];
    setInputText(JSON.stringify(example, null, 2));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/60 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clipboard className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Subida Masiva Local (JSON)</h2>
          </div>
          <button
            type="button"
            onClick={loadExample}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Cargar ejemplo
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
          Pega un array JSON con el formato de las aplicaciones. Este importador enviará los registros directamente a la base de datos de Supabase omitiendo validaciones externas e incluyendo la fecha de creación actual.
        </p>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder='[\n  {\n    "name": "App Ejemplo",\n    "description": "Una app",\n    "version": "1.0",\n    "category": "Aplicación",\n    "download_url": "https://...",\n    "image_url": "https://..."\n  }\n]'
          rows={12}
          className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-55 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-gray-900 dark:text-white font-mono placeholder:text-gray-400"
        />

        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoFetchLogos"
              checked={autoFetchLogos}
              onChange={(e) => setAutoFetchLogos(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="autoFetchLogos"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              Buscar logotipos automáticamente (Icon Horse)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="realTimeScraping"
              checked={realTimeScraping}
              onChange={(e) => setRealTimeScraping(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="realTimeScraping"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              Extraer datos reales de Play Store (Sincronización Inteligente)
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleImport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Importando en Supabase...
              </>
            ) : (
              "Procesar e Importar"
            )}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-200/60 dark:border-slate-700/50 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
          <span className="text-xs font-bold text-gray-600 dark:text-slate-350">{status}</span>
        </div>
      )}

      {!loading && status === "Importación finalizada." && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/35 rounded-3xl p-5 text-emerald-800 dark:text-emerald-350 shadow-sm">
          <div className="flex items-center gap-2 font-extrabold text-sm mb-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Proceso Completado con Éxito</span>
          </div>
          <p className="text-xs font-bold leading-relaxed">
            Las aplicaciones se inyectaron directamente en Supabase de forma correcta.
          </p>
        </div>
      )}

      {summaryList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-200/60 dark:border-slate-700/50">
          <h3 className="text-xs font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-widest mb-4">
            Resumen de Carga
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="w-full text-left text-xs font-bold text-gray-700 dark:text-slate-350">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Nombre App</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {summaryList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/10">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                        item.status === "Sincronizado"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-400"
                          : item.status === "Omitido"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-400"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/45 dark:text-rose-400"
                      }`}>
                        {item.status}
                      </span>
                      {item.error && (
                        <p className="text-[10px] text-red-500 font-medium mt-0.5">{item.error}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-200/60 dark:border-slate-700/50">
          <h3 className="text-xs font-extrabold text-gray-450 dark:text-slate-500 uppercase tracking-widest mb-4">
            Bitácora de Eventos
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl bg-gray-50 dark:bg-slate-900/30 p-4 border border-gray-150/40 dark:border-slate-800/40">
            {log.map((entry, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-start text-xs font-medium leading-relaxed ${
                  entry.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : entry.type === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-500 dark:text-red-400"
                }`}
              >
                {entry.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                ) : entry.type === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                )}
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
