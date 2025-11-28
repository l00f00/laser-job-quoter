import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
interface UploadDropzoneProps {
  onFileAccepted: (file: File, content: string, physicalWidthMm: number) => void;
}
export function UploadDropzone({ onFileAccepted }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [widthMm, setWidthMm] = useState<string>('100');
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ errors }) => {
        errors.forEach((err: any) => toast.error(err.message));
      });
      return;
    }
    const acceptedFile = acceptedFiles[0];
    if (!acceptedFile.type.match(/image\/(svg\+xml|png|jpeg)/)) {
      toast.error("Invalid file type", { description: "Please upload an SVG, PNG, or JPG file." });
      return;
    }
    setFile(acceptedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPreview(content);
    };
    reader.readAsDataURL(acceptedFile);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });
  const handleConfirm = () => {
    if (!file || !widthMm) {
      toast.error('Please provide a file and its physical width.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileAccepted(file, content, parseFloat(widthMm));
    };
    reader.readAsText(file);
  };
  const handleReset = () => {
    setFile(null);
    setPreview(null);
  };
  if (file && preview) {
    return (
      <Card className="w-full shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="aspect-video w-full rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
            <img src={preview} alt="File preview" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widthMm">Physical Width (mm)</Label>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <Input
                id="widthMm"
                type="number"
                value={widthMm}
                onChange={(e) => setWidthMm(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
          </div>
          <Button onClick={handleConfirm} className="w-full">
            Confirm Artwork
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div
      {...getRootProps()}
      className={`w-full p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors duration-200 ${
        isDragActive ? 'border-[rgb(99,102,241)] bg-indigo-50' : 'border-border hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <UploadCloud className="h-12 w-12" />
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop your file here' : 'Drag & drop your artwork, or click to browse'}
        </p>
        <p className="text-sm">SVG, PNG, or JPG (Max 10MB)</p>
      </div>
    </div>
  );
}