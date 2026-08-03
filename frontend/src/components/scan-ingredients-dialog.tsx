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
import { Camera, ImagePlus, Loader2, RotateCcw, Check, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Box = {
  key: string;
  label: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  matched: boolean;
};

export function ScanIngredientsDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleClose = (next: boolean) => {
    if (!submitting) reset();
    onOpenChange(next);
  };

  const handlePick = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
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
      setResult(data.data);
      if (data.data.matchedIngredients.length === 0) {
        toast.info('ไม่พบวัตถุดิบที่รู้จักในรูป ลองเลือกเองในหน้าแนะนำเมนู');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const goToRecommend = () => {
    const ids = result?.matchedIngredients.map((m) => m.id) ?? [];
    handleClose(false);
    if (ids.length === 0) {
      router.push('/recommend');
    } else {
      router.push(`/recommend?detected=${ids.join(',')}`);
    }
  };

  const boxes: Box[] = result
    ? [
        ...result.matchedIngredients
          .filter((m) => m.bbox)
          .map((m) => ({
            key: `m-${m.id}`,
            label: m.name,
            confidence: m.confidence,
            bbox: m.bbox!,
            matched: true,
          })),
        ...result.unmatchedLabels
          .filter((u) => u.bbox)
          .map((u, i) => ({
            key: `u-${i}`,
            label: u.label,
            confidence: u.confidence,
            bbox: u.bbox!,
            matched: false,
          })),
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>สแกนวัตถุดิบ</DialogTitle>
          <DialogDescription>
            {result
              ? 'ผลการตรวจจับวัตถุดิบ'
              : 'ถ่ายรูปหรืออัปโหลดรูปวัตถุดิบที่มี แล้วกดยืนยัน'}
          </DialogDescription>
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

        {result ? (
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview ?? undefined} alt="ผลการสแกน" className="h-full w-full object-cover" />
              {boxes.map((box) => (
                <div
                  key={box.key}
                  className={`absolute rounded-md border-2 ${
                    box.matched ? 'border-primary' : 'border-muted-foreground/60'
                  }`}
                  style={{
                    left: `${box.bbox.x * 100}%`,
                    top: `${box.bbox.y * 100}%`,
                    width: `${box.bbox.w * 100}%`,
                    height: `${box.bbox.h * 100}%`,
                  }}
                >
                  <span
                    className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      box.matched
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/80 text-white'
                    }`}
                  >
                    {box.label} ({Math.round(box.confidence * 100)}%)
                  </span>
                </div>
              ))}
            </div>

            {result.matchedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.matchedIngredients.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {m.name} · {Math.round(m.confidence * 100)}%
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> สแกนใหม่
              </Button>
              <Button className="flex-1" onClick={goToRecommend}>
                <Sparkles className="h-4 w-4" /> ไปแนะนำเมนู
              </Button>
            </div>
          </div>
        ) : preview ? (
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
