'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import type { DetectionResult } from '@/types';
import { Camera, ImagePlus, Loader2, RotateCcw, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScanIngredientsDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
  };

  const handleClose = (next: boolean) => {
    if (!submitting) reset();
    onOpenChange(next);
  };

  const handlePick = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleConfirm = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post<{ data: DetectionResult }>('/detections', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const detected = data.data.matchedIngredients;
      reset();
      onOpenChange(false);
      if (detected.length === 0) {
        toast.info('ไม่พบวัตถุดิบที่รู้จักในรูป ลองเลือกเองในหน้าแนะนำเมนู');
        router.push('/recommend');
      } else {
        toast.success(`ตรวจพบ ${detected.length} วัตถุดิบ (โมเดลจำลอง)`);
        router.push(`/recommend?detected=${detected.map((d) => d.id).join(',')}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>สแกนวัตถุดิบ</DialogTitle>
          <DialogDescription>ถ่ายรูปหรืออัปโหลดรูปวัตถุดิบที่มี แล้วกดยืนยัน</DialogDescription>
        </DialogHeader>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePick(e.target.files[0])}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePick(e.target.files[0])}
        />

        {preview ? (
          <div className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="รูปที่เลือก" className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset} disabled={submitting}>
                <RotateCcw className="h-4 w-4" /> เปลี่ยนรูป
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                ยืนยัน
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="h-4 w-4" /> ถ่ายรูป
            </Button>
            <Button variant="outline" className="w-full" onClick={() => galleryInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> เลือกจากคลังภาพ
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
