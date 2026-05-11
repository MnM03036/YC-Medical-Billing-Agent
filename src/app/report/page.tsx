"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText } from "lucide-react";

export default function ReportPage() {
    const router = useRouter();
    const [auditData, setAuditData] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("lastAuditResult");
        if (stored) {
            setAuditData(JSON.parse(stored));
        } else {
            router.push("/upload"); // Redirect if no data
        }
    }, [router]);

    if (!auditData) return <div className="p-10 text-center">Loading Report...</div>;

    const { summary, lineItems } = auditData;

    return (
        <div className="container mx-auto p-8 max-w-5xl space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Audit Results</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.totalBilled.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className={summary.totalPotentialSavings > 0 ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Potential Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">${summary.totalPotentialSavings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Anomalies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.flaggedItemsCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Line Items & Explanations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>CPT Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Billed</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.cpt_code}</TableCell>
                                    <TableCell>
                                        <div>{item.description}</div>
                                        {item.is_flagged && (
                                            <div className="text-sm text-red-600 mt-2 flex items-start gap-1">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                                                <span>{item.flag_reason}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">${item.charge.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {item.is_flagged ? (
                                            <Badge variant="destructive">Upcoding / Overcharge</Badge>
                                        ) : (
                                            <Badge variant="secondary">Verified</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {summary.flaggedItemsCount > 0 && (
                <div className="flex justify-end">
                    <button 
                        onClick={() => router.push("/review/new")}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Generate Appeal Letter
                    </button>
                </div>
            )}
        </div>
    );
}
