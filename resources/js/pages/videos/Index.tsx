import AppLayout from '@/layouts/app-layout';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Play, Plus, Tag, Video as VideoIcon, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { SharedData } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function VideosIndex() {
    const { auth } = usePage<SharedData>().props;
    const isSuper = auth.user?.role === 'superadmin';
    
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    
    // Form state
    const [form, setForm] = useState({
        id: null,
        title: '',
        description: '',
        role: 'all',
        tags: '',
        link: '',
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVideos(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchVideos = async (query = '') => {
        try {
            const res = await axios.get(`/api/videos?search=${query}`);
            setVideos(res.data);
        } catch (error) {
            toast.error('Error al cargar los videos');
        } finally {
            setLoading(false);
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (form.id) {
                await axios.put(`/api/videos/${form.id}`, form);
                toast.success('Video actualizado');
            } else {
                await axios.post('/api/videos', form);
                toast.success('Video creado');
            }
            setIsCreateModalOpen(false);
            fetchVideos();
            resetForm();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este video?')) return;
        try {
            await axios.delete(`/api/videos/${id}`);
            toast.success('Video eliminado');
            fetchVideos();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const openEdit = (v: any) => {
        setForm({
            id: v.id,
            title: v.title,
            description: v.description || '',
            role: v.role,
            tags: v.tags || '',
            link: v.link,
        });
        setIsCreateModalOpen(true);
    };

    const resetForm = () => {
        setForm({ id: null, title: '', description: '', role: 'all', tags: '', link: '' });
    };

    const playVideo = (v: any) => {
        setSelectedVideo(v);
        setIsPlayerOpen(true);
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
            return `https://www.youtube.com/embed/${id}`;
        }
        // Vimeo
        if (url.includes('vimeo.com')) {
            const id = url.split('/').pop();
            return `https://player.vimeo.com/video/${id}`;
        }
        return url;
    };

    const breadcrumbs = [
        { title: 'Inicio', href: '/dashboard' },
        { title: 'Videos de Capacitación', href: '/videos' },
    ];

    return (
        <AppLayout breadcrumbs={<Breadcrumbs items={breadcrumbs} />}>
            <Head title="Videos de Capacitación" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Videos de Capacitación</h1>
                        <p className="text-muted-foreground">Tutoriales y guías para el uso de la plataforma.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por título o tags..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {isSuper && (
                            <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Video
                            </Button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-muted" />)}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {videos.map((video: any) => (
                            <Card key={video.id} className="overflow-hidden group hover:shadow-lg transition-all border-primary/10">
                                <div className="relative aspect-video bg-muted flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => playVideo(video)}>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                                    <Play className="h-12 w-12 text-white z-20 opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-all" />
                                    {/* Thumbnail logic if possible */}
                                    <div className="absolute bottom-2 left-2 z-20">
                                        <Badge variant="outline" className="bg-black/50 text-white border-none backdrop-blur-sm">
                                            {video.role === 'all' ? 'Para todos' : video.role}
                                        </Badge>
                                    </div>
                                </div>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {video.description || 'Sin descripción.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 py-0 flex flex-wrap gap-1">
                                    {video.tags?.split(',').map((tag: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="text-[0.65rem] h-5">
                                            {tag.trim()}
                                        </Badge>
                                    ))}
                                </CardContent>
                                <CardFooter className="p-4 flex justify-between">
                                    <Button variant="ghost" size="sm" onClick={() => playVideo(video)}>
                                        <Play className="mr-2 h-4 w-4" /> Ver Video
                                    </Button>
                                    {isSuper && (
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(video)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(video.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {videos.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <VideoIcon className="h-12 w-12 mb-4 opacity-20" />
                        <p>No se encontraron videos que coincidan con tu búsqueda.</p>
                    </div>
                )}
            </div>

            {/* CREATE/EDIT MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{form.id ? 'Editar Video' : 'Nuevo Video'}</DialogTitle>
                        <DialogDescription>Completa la información para el video de capacitación.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Dirigido a</Label>
                                <Select value={form.role} onValueChange={val => setForm({...form, role: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="superadmin">Superadmin</SelectItem>
                                        <SelectItem value="admin">Administradores</SelectItem>
                                        <SelectItem value="bodega">Bodega</SelectItem>
                                        <SelectItem value="local">Locales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags">Etiquetas (sep. por coma)</Label>
                                <Input id="tags" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="ventas, cambios, tutorial" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link">Enlace del Video (YouTube/Vimeo)</Label>
                            <Input id="link" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Video</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* PLAYER MODAL */}
            <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
                <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-black">
                    <DialogHeader className="p-4 bg-background border-b sr-only">
                        <DialogTitle>{selectedVideo?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video w-full">
                        {selectedVideo && (
                            <iframe
                                src={getEmbedUrl(selectedVideo.link)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}
                    </div>
                    <div className="p-4 bg-background">
                        <h3 className="text-lg font-bold">{selectedVideo?.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{selectedVideo?.description}</p>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
