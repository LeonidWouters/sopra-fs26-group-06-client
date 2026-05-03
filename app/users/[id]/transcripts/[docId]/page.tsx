"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, Spin, Badge, Tooltip } from "antd";
import { LogoutOutlined, AppstoreOutlined, TeamOutlined, ArrowLeftOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import mainStyles from "@/styles/mainpage.module.css";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import { TranscriptGetDTO, NoteGetDTO } from "@/types/transcript";
import { getAvatarColor, getAvatarInitials } from "@/utils/avatarColor";
import { User } from "@/types/user";

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
    const { value: loggedInId } = useLocalStorage<string>("id", "");
    const [me, setMe] = useState<User | null>(null);

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
            try {
                const fetchedMe: User = await apiService.get<User>(`/users/${loggedInId}`, token);
                setMe(fetchedMe);
            } catch (e) {
                console.error(e);
            }
        };

        fetchDocument();
    }, [isReady, token, docId, kind, router, apiService]);

    const handleLogout = (): void => {
        apiService.put("/users/logout", null, token);
        clearToken();
        clearId();
        router.push("/");
    };

    const handleDownload = (): void => {
        const filename = `${kind}-${createdAt}.txt`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const sizeKb = Math.max(1, Math.round(new TextEncoder().encode(content).length / 1024));

    if (!isReady || loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={mainStyles.appShell}>
            <aside className={mainStyles.sidebar}>
                <div className={mainStyles.sidebarTop}>
                    <div className={mainStyles.sbLogo} onClick={() => router.push('/mainpage')} style={{cursor: 'pointer'}}>
                        <Image src="/banner_logo.png" alt="Logo" width={32} height={32}
                               style={{width: 32, height: 32, objectFit: 'contain'}}/>
                    </div>
                    <Tooltip title="Rooms" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => router.push("/mainpage")}>
                            <AppstoreOutlined/>
                        </div>
                    </Tooltip>
                    <Tooltip title="Friends" placement="right">
                        <Badge count={me?.pendingFriendRequests?.length ?? 0} size="small" offset={[-4, 4]}>
                            <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/friends`)}>
                                <TeamOutlined/>
                            </div>
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Transcripts & Notes" placement="right">
                        <div className={`${mainStyles.sbIcon} ${mainStyles.sbIconActive}`}
                             onClick={() => router.push(`/users/${loggedInId}/transcripts`)}>
                            <FileTextOutlined/>
                        </div>
                    </Tooltip>
                </div>
                <div className={mainStyles.sidebarBottom}>
                    <Tooltip title="Sign Out" placement="right">
                        <div className={mainStyles.sbIcon} onClick={handleLogout}>
                            <LogoutOutlined/>
                        </div>
                    </Tooltip>
                    <Tooltip title="My Profile" placement="right">
                        <div
                            className={mainStyles.sbAvatar}
                            style={me?.profilePicture ? {} : {backgroundColor: getAvatarColor(me?.username ?? "")}}
                            onClick={() => router.push(`/users/${loggedInId}`)}
                        >
                            {me?.profilePicture
                                ? <img src={me.profilePicture} style={{width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover"}} />
                                : getAvatarInitials(me?.username ?? "")
                            }
                        </div>
                    </Tooltip>
                </div>
            </aside>
            <div className={mainStyles.container}>
                <Button icon={<ArrowLeftOutlined/>} type="text"
                        onClick={() => router.push(`/users/${id}/transcripts`)} style={{marginBottom: 16}}>
                    Back
                </Button>
                <div className={mainStyles.mainContent}>
                <div style={{ maxWidth: 820, margin: "0 auto" }}>
                    <div style={{
                        background: "#F5EFFD",
                        border: "1px solid #E0CCF5",
                        borderRadius: 14,
                        padding: "24px 36px",
                        marginBottom: 16,
                        boxShadow: "0 4px 24px rgba(107,33,214,0.08)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 16,
                    }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <span style={{
                                    padding: "3px 12px",
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: kind === "note" ? "#dcfce7" : "#ede9fe",
                                    color: kind === "note" ? "#059669" : "#6d28d9",
                                }}>
                                    {kind === "note" ? "Note" : "Transcript"}
                                </span>
                                <span style={{ fontSize: 13, color: "#9ca3af" }}>{createdAt}</span>
                            </div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "#111827" }}>
                                {kind === "note" ? "Note" : "Transcript"} — {createdAt}
                            </h1>
                            <div style={{ fontSize: 13, color: "#9ca3af" }}>
                                {wordCount} word{wordCount !== 1 ? "s" : ""} · {sizeKb} KB
                            </div>
                        </div>
                        <Button icon={<DownloadOutlined />} onClick={handleDownload} style={{ borderRadius: 8, flexShrink: 0 }}>
                            Download
                        </Button>
                    </div>
                    <div style={{
                        background: "#F5EFFD",
                        border: "1px solid #E0CCF5",
                        borderRadius: 14,
                        padding: "36px 48px",
                        boxShadow: "0 4px 24px rgba(107,33,214,0.08)",
                    }}>
                        <div style={{ lineHeight: 1.9, color: "#1a1a1a", fontSize: 15 }}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default DocumentViewerPage;
