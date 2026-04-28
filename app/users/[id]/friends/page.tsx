"use client";
import {Button, Card, Tag, Badge, Tooltip} from "antd";
import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";
import {User} from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import {useAuth} from "@/hooks/useAuth";
import mainStyles from "@/styles/mainpage.module.css";
import {LogoutOutlined, AppstoreOutlined, TeamOutlined, ArrowLeftOutlined, FileTextOutlined} from "@ant-design/icons";
import Image from "next/image";
import {getAvatarColor, getAvatarInitials} from "@/utils/avatarColor";

const FriendsPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const {id} = useParams();
    const {token, isReady} = useAuth();
    const {value: loggedInId, clear: clearId} = useLocalStorage<string>("id", "");
    const {clear: clearToken} = useLocalStorage<string>("token", "");
    const isOwnProfile = String(loggedInId) === String(id);
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<User[]>([]);
    const [me, setMe] = useState<User | null>(null);

    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.push("/");
            return;
        }
        const load = async () => {
            const f: User[] = await apiService.get(`/users/${id}/friends`, token);
            setFriends(f);
            if (isOwnProfile) {
                const r: User[] = await apiService.get(`/users/${id}/friend-requests`, token);
                setPendingRequests(r);
            }
            const fetchedMe: User = await apiService.get(`/users/${loggedInId}`, token);
            setMe(fetchedMe);
        };
        load();
        const interval = setInterval(load, 3000);
        return () => clearInterval(interval);
    }, [apiService, isReady, token, id, router, isOwnProfile]);

    const handleAccept = async (senderId: string) => {
        await apiService.put(`/users/${id}/friend-request/accept`, {senderId: Number(senderId)}, token);
        const r: User[] = await apiService.get(`/users/${id}/friend-requests`, token);
        setPendingRequests(r);
        const f: User[] = await apiService.get(`/users/${id}/friends`, token);
        setFriends(f);
    };

    const handleDecline = async (senderId: string) => {
        await apiService.put(`/users/${id}/friend-request/decline`, {senderId: Number(senderId)}, token);
        const r: User[] = await apiService.get(`/users/${id}/friend-requests`, token);
        setPendingRequests(r);
    };

    if (!isReady) return <div>Loading...</div>;

    return (
        <div className={mainStyles.appShell}>
            <aside className={mainStyles.sidebar}>
                <div className={mainStyles.sidebarTop}>
                    <div className={mainStyles.sbLogo}>
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
                            <div className={`${mainStyles.sbIcon} ${mainStyles.sbIconActive}`}>
                                <TeamOutlined/>
                            </div>
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Transcripts" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/transcripts`)}>
                            <FileTextOutlined/>
                        </div>
                    </Tooltip>
                </div>
                <div className={mainStyles.sidebarBottom}>
                    <Tooltip title="Sign Out" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => {
                            apiService.put("/users/logout", null, token);
                            clearToken();
                            clearId();
                            router.push("/");
                        }}>
                            <LogoutOutlined/>
                        </div>
                    </Tooltip>
                    <Tooltip title="My Profile" placement="right">
                        <div className={mainStyles.sbAvatar}
                             style={{backgroundColor: getAvatarColor(me?.username ?? "")}}
                             onClick={() => router.push(`/users/${loggedInId}`)}>
                            {getAvatarInitials(me?.username ?? "")}
                        </div>
                    </Tooltip>
                </div>
            </aside>
            <div className={mainStyles.container}>
                <Button icon={<ArrowLeftOutlined/>} type="text"
                        onClick={() => router.push(`/mainpage`)} style={{marginBottom: 16}}>
                    Back
                </Button>
                <div className={mainStyles.mainContent}>
                <div className={mainStyles.userOverview}>
                    <div style={{fontSize: 24, fontWeight: 600, marginBottom: 16}}>Friends ({friends.length})</div>
                    <div className={mainStyles.userGrid}>
                        {friends.length === 0 ? <p>No friends yet.</p> : friends.map((friend) => (
                            <Card key={friend.id} className={mainStyles.card}
                                  onClick={() => router.push(`/users/${friend.id}`)}
                                  title={
                                      <div style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          lineHeight: "1.2",
                                          padding: "4px 0"
                                      }}>
                                          <span style={{
                                              fontSize: 16,
                                              fontWeight: 600,
                                              color: "#ffffff"
                                          }}>{friend.name}</span>
                                          <span style={{
                                              fontSize: 12,
                                              color: "#a0a0b8",
                                              fontWeight: "normal",
                                              marginTop: 1
                                          }}>@{friend.username}</span>
                                      </div>
                                  }
                                  extra={<Tag
                                      color={friend.status === "ONLINE" ? "green" : "red"}>{friend.status}</Tag>}
                                  variant="borderless"
                                  styles={{
                                      header: {
                                          backgroundColor: "rgba(44, 44, 84, 0.95)",
                                          borderBottom: "1px solid rgba(255,255,255,0.1)"
                                      },
                                      body: {backgroundColor: "rgba(64, 64, 122, 0.85)", cursor: "pointer"}
                                  }}
                            >
                                <p style={{color: "#e2e8f0", margin: 0}}>{friend.bio}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                {isOwnProfile && pendingRequests.length > 0 && (
                    <div className={mainStyles.userOverview} style={{marginTop: 32}}>
                        <div style={{fontSize: 24, fontWeight: 600, marginBottom: 16}}>Friend Requests
                            ({pendingRequests.length})
                        </div>
                        {pendingRequests.map((r) => (
                            <div key={r.id} style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 0",
                                borderBottom: "1px solid rgba(0,0,0,0.1)"
                            }}>
                                <span style={{color: "#1a1a2e", fontWeight: 500}}>{r.username}</span>
                                <div style={{display: "flex", gap: 8}}>
                                    <Button type="primary" size="small"
                                            onClick={() => handleAccept(String(r.id))}>Accept</Button>
                                    <Button size="small" danger
                                            onClick={() => handleDecline(String(r.id))}>Decline</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
        </div>
    );
};

export default FriendsPage;
