"use client";

import { useState } from "react";
import { generateAppealAction } from "@/app/actions/appealActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewAppealPage() {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [draft, setDraft] = useState<string>("");
    
    // Form states
    const [stateCode, setStateCode] = useState("CA");
    const [planType, setPlanType] = useState("Employer (Self-Funded/ERISA)");
    const [patientName, setPatientName] = useState("");
    const [insurer, setInsurer] = useState("");
    const [denialText, setDenialText] = useState("");
    
    // Derived logically from session in proper flow, stubbed here
    const billId = "dummy-bill-id-123";

    async function handleGenerate() {
        setIsGenerating(true);
        const res = await generateAppealAction(billId, denialText, stateCode, planType, patientName, insurer);
        if (res.success && res.draft) {
            setDraft(res.draft);
            // Optionally redirect to a specific review ID page normally:
            // router.push(`/review/${res.appealId}`);
        } else {
            alert("Error: " + res.error);
        }
        setIsGenerating(false);
    }

    return (
        <div className="container mx-auto p-8 max-w-4xl space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Generate Legal Appeal</h1>

            {!draft ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Patient & Denial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <input value={stateCode} onChange={e => setStateCode(e.target.value)} className="w-full border p-2 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Plan Type</label>
                                <input value={planType} onChange={e => setPlanType(e.target.value)} className="w-full border p-2 rounded-md" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Patient Name</label>
                                <input value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full border p-2 rounded-md" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Insurer Name</label>
                                <input value={insurer} onChange={e => setInsurer(e.target.value)} className="w-full border p-2 rounded-md" placeholder="Aetna / BlueCross" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Raw Denial Text</label>
                            <textarea 
                                value={denialText} 
                                onChange={e => setDenialText(e.target.value)} 
                                className="w-full border p-2 rounded-md h-32"
                                placeholder="Paste the exact reason code explanation from the EOB..."
                            />
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !patientName || !insurer}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold flex items-center justify-center gap-2 w-full hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isGenerating ? "Grounding in local laws & drafting..." : "Generate AI Appeal Letter"}
                        </button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Review & Edit Draft</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <textarea 
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-full h-[500px] border p-4 rounded-md font-mono text-sm leading-relaxed"
                        />
                        <div className="flex gap-4 justify-end">
                            <button className="px-4 py-2 border rounded-md" onClick={() => setDraft("")}>Back</button>
                            <button className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700">
                                Approve & Dispatch
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
