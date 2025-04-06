// neuroforge/frontend/components/subjects/SubjectList.tsx
// Purpose: Displays the list of subjects fetched from the API
"use client"; // Required for useEffect, useState

import React, { useState, useEffect } from 'react';
import { getSubjects } from 'lib/api'; // API fetching function
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Skeleton } from "components/ui/skeleton"; // For loading state
import { Badge } from "@/components/ui/badge"; // For tags
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import Link from 'next/link';

// Define a basic Subject type (sync with backend model)
interface Subject {
    _id: string;
    title: string;
    description?: string;
    tags?: string[];
    prerequisites?: string[]; // Array of IDs
    // Add other relevant fields: orderIndex, version, etc.
}

export function SubjectList() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getSubjects();
                if (response.success && response.data) {
                    // The data from the backend might already be sorted by the service
                    setSubjects(response.data);
                } else {
                    setError(response.message || 'Failed to fetch subjects.');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching subjects.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []); // Empty dependency array ensures this runs once on mount

    if (loading) {
        // Show skeleton loaders while fetching data
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                    <Card key={index}>
                        <CardHeader>
                             <Skeleton className="h-6 w-3/4 mb-2" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (subjects.length === 0) {
         return (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>No Subjects Found</AlertTitle>
                <AlertDescription>
                    No subjects have been added to the NeuroForge catalog yet. Check back soon or contact an administrator.
                </AlertDescription>
            </Alert>
         );
    }

    return (
        // Display fetched subjects - Consider using drag-and-drop library here later
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
                <Card key={subject._id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="text-lg">{subject.title}</CardTitle>
                        {subject.description && (
                             <CardDescription className="line-clamp-2">{subject.description}</CardDescription>
                         )}
                         <div className="flex flex-wrap gap-1 pt-2">
                            {subject.tags?.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                         </div>
                    </CardHeader>
                    <CardContent>
                        {/* Add action button or link */}
                         <Button asChild variant="link" className="p-0 h-auto">
                             <Link href={`/subjects/${subject._id}`}>View Details</Link>
                         </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}