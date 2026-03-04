import { useCallback, useState } from "react";
import { Upload, FileText, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useBulkUpload } from "@/hooks/useAPMCHooks";

export default function BulkUpload() {
  const { progress, status, error } = useBulkUpload();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    setUploadStatus("processing");
    setUploadProgress(0);
    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadStatus("success");
          return 100;
        }
        return p + 20;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Bulk Upload</h1>
        <p className="text-sm text-muted-foreground">Upload price data via Excel or CSV</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                "cursor-pointer"
              )}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drag & drop your file here</p>
                <p className="text-xs text-muted-foreground">or click to browse (CSV, XLSX)</p>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}

            {uploadStatus === "processing" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading…</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleUpload} disabled={!file || uploadStatus === "processing"}>
                {uploadStatus === "processing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            {uploadStatus === "idle" && (
              <p className="text-sm text-muted-foreground">No file uploaded yet. Select a file and click Upload to begin.</p>
            )}
            {uploadStatus === "processing" && (
              <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info/10 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-info" />
                <div>
                  <p className="text-sm font-medium text-info">Processing</p>
                  <p className="text-xs text-muted-foreground">Validating and importing records…</p>
                </div>
              </div>
            )}
            {uploadStatus === "success" && (
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Upload Successful</p>
                  <p className="text-xs text-muted-foreground">All records have been imported successfully.</p>
                </div>
              </div>
            )}
            {uploadStatus === "failed" && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Upload Failed</p>
                  <p className="text-xs text-muted-foreground">{error || "An error occurred during processing."}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
