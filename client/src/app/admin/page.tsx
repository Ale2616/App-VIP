"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { useApps, useCreateApp, useDeleteApp, useUploadImage } from "@/hooks/use-apps";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Plus, Trash2, Loader2, ExternalLink, Download,
  MoreVertical, Crown, Package, Users, Search, X, Upload,
} from "lucide-react";
import { toast } from "sonner";

const appSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  download_url: z.string().url("Debe ser una URL válida"),
  category: z.string().min(1, "La categoría es requerida"),
});
type AppFormData = z.infer<typeof appSchema>;

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { profile, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useApps();
  const createApp = useCreateApp();
  const deleteApp = useDeleteApp();
  const uploadImage = useUploadImage();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
    defaultValues: { name: "", description: "", download_url: "", category: "" },
  });

  const handleUpload = async (file: File): Promise<string> => {
    const result = await uploadImage.mutateAsync(file);
    return result.url;
  };

  const onSubmit = async (formData: AppFormData) => {
    if (!iconFile || !imageFile) { toast.error("El ícono y la imagen son requeridos"); return; }
    try {
      const [iconUrl, imageUrl] = await Promise.all([handleUpload(iconFile), handleUpload(imageFile)]);
      await createApp.mutateAsync({ ...formData, icon_url: iconUrl, image_url: imageUrl, uploaded_by: profile?.id });
      toast.success("¡Aplicación creada exitosamente!");
      reset(); setIconFile(null); setImageFile(null); setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Error al crear la aplicación");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApp.mutateAsync(id);
      toast.success("¡Aplicación eliminada!");
      setConfirmDelete(null);
    } catch { toast.error("Error al eliminar"); }
  };

  const filteredApps = data?.apps?.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalDownloads = data?.apps?.reduce((sum, app) => sum + (app.download_count ?? 0), 0) || 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 relative">
      {/* BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-3xl" animate={{ scale:[1,1.2,1], opacity:[.3,.5,.3] }} transition={{ duration:15, repeat:Infinity }} />
        <motion.div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/15 to-fuchsia-500/15 rounded-full blur-3xl" animate={{ scale:[1.2,1,1.2], opacity:[.2,.4,.2] }} transition={{ duration:18, repeat:Infinity }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800"><ArrowLeft className="w-5 h-5" /></div>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20"><Crown className="w-5 h-5 text-black" /></div>
              <div><h1 className="text-xl font-bold text-white">Panel de Control</h1><p className="text-xs text-slate-500">Gestiona tu catálogo de aplicaciones</p></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/upload" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-900/50">
              <Upload className="w-4 h-4" /><span className="hidden sm:inline">Upload Center</span>
            </Link>
            <Link href="/" className="text-sm text-slate-400 hover:text-purple-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-900/50">
              <ExternalLink className="w-4 h-4" /><span className="hidden sm:inline">Ver Sitio</span>
            </Link>
            <Button variant="outline" size="sm" onClick={()=>{logout();router.push("/");}} className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs">
              <X className="w-3 h-3" /><span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2"><div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500"><Package className="w-4 h-4 text-white" /></div>Total de Apps</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-white">{isLoading ? <Skeleton className="h-10 w-16" /> : data?.apps.length || 0}</p><p className="text-xs text-slate-500 mt-1">Aplicaciones registradas</p></CardContent>
          </Card>
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2"><div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500"><Download className="w-4 h-4 text-white" /></div>Total de Descargas</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-white">{isLoading ? <Skeleton className="h-10 w-24" /> : (totalDownloads ?? 0).toLocaleString("es-ES")}</p><p className="text-xs text-slate-500 mt-1">Descargas totales</p></CardContent>
          </Card>
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2"><div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500"><Users className="w-4 h-4 text-white" /></div>Administrador</CardTitle></CardHeader>
            <CardContent><p className="text-lg font-semibold text-white">{profile?.name}</p><p className="text-xs text-slate-500 truncate">{profile?.email}</p></CardContent>
          </Card>
        </div>

        {/* Add App */}
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div><h2 className="text-xl font-bold text-white">Aplicaciones Registradas</h2><p className="text-sm text-slate-500 mt-0.5">Gestiona todas las apps del catálogo</p></div>
          <Dialog open={open} onOpenChange={v=>{setOpen(v);if(!v){reset();setIconFile(null);setImageFile(null);}}}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25"><Plus className="w-4 h-4 mr-2" />Agregar Nueva</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-800 text-white max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white text-xl flex items-center gap-2"><div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500"><Plus className="w-5 h-5 text-white" /></div>Agregar Nueva Aplicación</DialogTitle>
                <DialogDescription className="text-slate-400">Completa todos los campos para agregar una app</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Ícono</Label>
                    <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50">
                      {iconFile ? <img src={URL.createObjectURL(iconFile)} alt="Icon" className="w-16 h-16 rounded-xl object-cover shadow-lg" /> : <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center"><Package className="w-8 h-8 text-slate-600" /></div>}
                      <Input type="file" accept="image/*" onChange={e=>e.target.files && setIconFile(e.target.files[0])} className="bg-slate-950 border-slate-800 text-xs cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Captura</Label>
                    <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50">
                      {imageFile ? <img src={URL.createObjectURL(imageFile)} alt="Screenshot" className="w-full h-16 rounded-xl object-cover shadow-lg" /> : <div className="w-full h-16 rounded-xl bg-slate-800 flex items-center justify-center"><Package className="w-6 h-6 text-slate-600" /></div>}
                      <Input type="file" accept="image/*" onChange={e=>e.target.files && setImageFile(e.target.files[0])} className="bg-slate-950 border-slate-800 text-xs cursor-pointer" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2"><Label htmlFor="name" className="text-white">Nombre</Label><Input id="name" {...register("name")} placeholder="Ej: WhatsApp" className="bg-slate-950/50 border-slate-800" />{errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="category" className="text-white">Categoría</Label><select id="category" {...register("category")} className="w-full h-10 rounded-lg border border-slate-800 bg-slate-950/50 px-3 text-white text-sm"><option value="">Selecciona</option><option value="juegos">🎮 Juego</option><option value="aplicaciones">📱 Aplicación</option></select>{errors.category && <p className="text-sm text-red-400">{errors.category.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="downloadUrl" className="text-white">Enlace de Descarga</Label><Input id="downloadUrl" {...register("download_url")} placeholder="https://..." className="bg-slate-950/50 border-slate-800" />{errors.download_url && <p className="text-sm text-red-400">{errors.download_url.message}</p>}</div>
                <div className="space-y-2"><Label htmlFor="description" className="text-white">Descripción</Label><Textarea id="description" {...register("description")} rows={4} placeholder="Describe la app..." className="bg-slate-950/50 border-slate-800 resize-none" />{errors.description && <p className="text-sm text-red-400">{errors.description.message}</p>}</div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild><Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={createApp.isPending || uploadImage.isPending} className="bg-gradient-to-r from-purple-500 to-fuchsia-600">
                    {createApp.isPending || uploadImage.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creando...</>) : (<><Plus className="mr-2 h-4 w-4"/>Crear</>)}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input type="text" placeholder="Buscar apps..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-slate-900/60 border-slate-800 pl-11 pr-4 py-6 text-white placeholder:text-slate-600 rounded-xl" />
          {searchTerm && <button onClick={()=>setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-full"><X className="w-4 h-4"/></button>}
        </div>

        {/* Table */}
        <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredApps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-800 bg-slate-900/30"><th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-4">Aplicación</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-4 hidden sm:table-cell">Categoría</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-4 hidden md:table-cell">Descargas</th><th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-4">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4"><div className="flex items-center gap-3">
                          {app.icon_url ? <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-xl object-cover shadow-lg" /> : <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center"><Package className="w-6 h-6 text-slate-600" /></div>}
                          <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{app.name}</p><p className="text-xs text-slate-500 truncate max-w-[200px]">{app.description}</p></div>
                        </div></td>
                        <td className="px-6 py-4 hidden sm:table-cell"><Badge variant="secondary" className="text-xs bg-slate-800/50 border-slate-700">{app.category}</Badge></td>
                        <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-slate-400 flex items-center gap-1.5"><Download className="w-3 h-3" />{(app.download_count ?? 0).toLocaleString("es-ES")}</span></td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-800"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800"><DropdownMenuItem onClick={()=>setConfirmDelete(app.id)} className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem></DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center"><div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center"><Package className="w-10 h-10 text-slate-600" /></div><p className="text-slate-400 text-lg mb-2">{searchTerm ? "No se encontraron resultados" : "Aún no hay aplicaciones"}</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={()=>setConfirmDelete(null)}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2"><div className="p-2 rounded-lg bg-red-500/20"><Trash2 className="w-5 h-5 text-red-400" /></div>Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-slate-400">¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancelar</Button></DialogClose>
            <Button onClick={()=>confirmDelete && handleDelete(confirmDelete)} disabled={deleteApp.isPending} variant="destructive" className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30">
              {deleteApp.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Eliminando...</>) : (<><Trash2 className="mr-2 h-4 w-4"/>Sí, Eliminar</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
