import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Briefcase } from 'lucide-react';
import { Department } from '@/types';

interface EmployeeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string | null;
    onUpdate: () => void;
}

interface ProfileData {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    position: string | null;
    department_id: string | null;
    join_date: string | null;
    is_active: boolean | null;
    employee_id: string | null;
}

export function EmployeeDetailModal({ isOpen, onClose, employeeId, onUpdate }: EmployeeDetailModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Data State
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Form State
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (isOpen && employeeId) {
            loadData();
        }
    }, [isOpen, employeeId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Master Data in Parallel
            const [dRes, empRes] = await Promise.all([
                supabase.from('departments').select('*'),
                supabase.from('profiles').select('*').eq('id', employeeId!).single()
            ]);

            if (dRes.data) setDepartments(dRes.data as Department[]);

            if (empRes.data) {
                setProfile(empRes.data as ProfileData);
                setFormData({
                    full_name: empRes.data.full_name || '',
                    email: empRes.data.email || '',
                    phone: empRes.data.phone || '',
                    position: empRes.data.position || '',
                    department_id: empRes.data.department_id || '',
                    join_date: empRes.data.join_date || '',
                    employee_id: empRes.data.employee_id || '',
                });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Gagal memuat data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = {
                full_name: formData.full_name,
                phone: formData.phone || null,
                position: formData.position || null,
                department_id: formData.department_id || null,
                join_date: formData.join_date || null,
                employee_id: formData.employee_id || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').update(updates).eq('id', employeeId!);

            if (error) throw error;

            toast({ title: 'Data Berhasil Disimpan' });
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast({ title: 'Gagal menyimpan', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Detail Karyawan</DialogTitle>
                            <DialogDescription>Edit profil karyawan</DialogDescription>
                        </div>
                        <Badge variant={profile?.is_active ? 'default' : 'secondary'}>
                            {profile?.is_active ? 'AKTIF' : 'NON-AKTIF'}
                        </Badge>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="profile">
                                <User className="w-4 h-4 mr-2" /> Data Diri
                            </TabsTrigger>
                            <TabsTrigger value="job">
                                <Briefcase className="w-4 h-4 mr-2" /> Pekerjaan
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: PROFILE */}
                        <TabsContent value="profile" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <Input value={formData.full_name} onChange={e => updateField('full_name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Akun Login)</Label>
                                    <Input value={formData.email} disabled className="bg-slate-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nomor Karyawan (NIP)</Label>
                                    <Input value={formData.employee_id} onChange={e => updateField('employee_id', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nomor HP / WhatsApp</Label>
                                    <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 2: JOB */}
                        <TabsContent value="job" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Departemen</Label>
                                    <Select value={formData.department_id} onValueChange={v => updateField('department_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Dept..." /></SelectTrigger>
                                        <SelectContent>
                                            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Posisi / Jabatan</Label>
                                    <Input value={formData.position} onChange={e => updateField('position', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Bergabung</Label>
                                    <Input type="date" value={formData.join_date} onChange={e => updateField('join_date', e.target.value)} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter className="mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
