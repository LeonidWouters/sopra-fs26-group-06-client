"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, Spin } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import mainStyles from "@/styles/mainpage.module.css";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import { TranscriptGetDTO, NoteGetDTO } from "@/types/transcript";

const DocumentViewerPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { id, docId } = useParams();
    const searchParams = useSearchParams();
    const kind = searchParams.get("kind") ?? "transcript";
    const { token, isReady } = useAuth();
    const { clear: clearToken } = useLocalStorage<string>("token", "");
    const { clear: clearId } = useLocalStorage<string>("id", "");

    const [content, setContent] = useState<string>("");
    const [createdAt, setCreatedAt] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.push("/");
            return;
        }

        const fetchDocument = async () => {
            try {
                const endpoint = kind === "note" ? `/notes/${docId}` : `/transcripts/${docId}`;
                const data = await apiService.get<TranscriptGetDTO | NoteGetDTO>(endpoint, token);
                setContent(data.content ?? "");
                setCreatedAt(data.createdAt?.slice(0, 10) ?? "");
            } catch {
                setContent("Could not load document.");
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [isReady, token, docId, kind, router, apiService]);

    const handleLogout = (): void => {
        apiService.post("/users/logout", null, token);
        clearToken();
        clearId();
        router.push("/");
    };

    if (!isReady || loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={mainStyles.container}>
            <div className={mainStyles.navbar}>
                <div className={mainStyles.logoWrapper}>
                    <Image
                        src="/unnamed-Photoroom.png"
                        alt="CommunicALL"
                        width={200}
                        height={55}
                        style={{ width: "auto", maxWidth: "200px", height: "100%", maxHeight: "55px" }}
                    />
                </div>
                <div className={mainStyles.navButtons}>
                    <Button color="default" variant="text" onClick={() => router.push(`/users/${id}/transcripts`)}>
                        ← Back
                    </Button>
                    <Button color="danger" variant="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                        Sign Out
                    </Button>
                </div>
            </div>

            <div className={mainStyles.mainContent}>
                <div style={{
                    maxWidth: 800,
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: 12,
                    padding: "40px 48px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}>
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                            {kind === "note" ? "Note" : "Transcript"} — {createdAt}
                        </h1>
                    </div>
                    <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", marginBottom: 32 }} />
                    <div style={{ lineHeight: 1.8, color: "#1a1a1a" }}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewerPage;
