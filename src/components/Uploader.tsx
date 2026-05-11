"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "./ui/card";
import { UploadCloud, Loader2 } from "lucide-react";

export function Uploader() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setErrorMsg("");

        try {
            // Note: Since passing FileURI strictly to Gemini needs Google File API, we mock the Gemini File upload here 
            // by passing a dummy URI until Supabase storage or actual Google File API flow is configured dynamically on backend.
            // Normally, we'd upload to Supabase, then pass the public URL or base64 to our server function.
            
            // To simulate Gemini 1.5 flash processing for testing locally:
            const simulatedMime = file.type;
            const simulatedUrl = "gs://your-bucket-or-temp-google-file-id/dummy.pdf"; // Need a real GCP or Google File URI
            
            // Note for actual MVP: Gemini @google/genai lets us pass raw Base64 data inline payload 
            // if we are under size limits. Let's send the base64 string to the backend to simplify the API.
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result?.toString().split(",")[1];
                
                // Let's call a slightly modified backend, but per strict rules, backend requested `fileUri`. Next step handles that.
                // We'll call the backend with dummy uri for now to mock the transition.
                const res = await fetch("/api/audit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileUri: simulatedUrl, mimeType: simulatedMime, base64: base64Data })
                });

                const data = await res.json();
                if (data.error) throw new Error(data.error);

                // Store temporarily in session to show on report page
                sessionStorage.setItem("lastAuditResult", JSON.stringify(data));
                router.push("/report");
            };

        } catch (err: any) {
            setErrorMsg(err.message || "Failed to upload and audit document.");
            setIsUploading(false);
        }
    }, [router]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
        },
        maxFiles: 1,
    });

    return (
        <Card className="w-full max-w-lg mx-auto mt-10">
            <CardContent className="p-8">
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                        isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Uploading & AI Analyzing...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <UploadCloud className="w-10 h-10 text-muted-foreground" />
                            {isDragActive ? (
                                <p className="text-lg font-medium">Drop the medical bill here ...</p>
                            ) : (
                                <div>
                                    <p className="text-lg font-medium">Drag & drop your bill</p>
                                    <p className="text-sm text-muted-foreground mt-1">Accepts PDF, JPG, or PNG</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {errorMsg && (
                    <p className="mt-4 text-sm text-red-500 text-center">{errorMsg}</p>
                )}
            </CardContent>
        </Card>
    );
}
