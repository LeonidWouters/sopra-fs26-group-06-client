"use client";
import {Avatar, Badge, Button, ConfigProvider, Divider, Form, Input, message, Radio} from "antd";
import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";
import {User} from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import {useAuth} from "@/hooks/useAuth";
import styles from "@/styles/page.module.css";


interface FormFieldProps {
    password: string;
}

const Profile: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [user, setUser] = useState<User | null>(null);
    const {id} = useParams();
    const {token, isReady} = useAuth();
    const [messageApi, contextHolder] = message.useMessage();
    const {value: loggedInId, clear: clearId} = useLocalStorage<string>("id", "");
    const {clear: clearToken,} = useLocalStorage<string>("token", "");
    const isOwnProfile = String(loggedInId) === String(id);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editUsername, setEditUsername] = useState<string>("");
    const [editBio, setEditBio] = useState<string>("");
    const [editDisability, setEditDisability] = useState<"HEARING" | "DEAF">("HEARING");


    const handleLogout = (): void => {
        apiService.put("/users/logout", null, token);
        clearToken();
        clearId();
        router.push("/");
    };

    const changePassword = async (values: FormFieldProps) => {
        try {
            await apiService.put<User>(
                `/users/${id}/password`,
                values,
                token,
            );
            await apiService.put("/users/logout", null, token);
            clearToken();
            clearId()
            router.push("/");
        } catch (error) {

            messageApi.open({
                type: "error",
                content: `password could not be changed because of ${error}`,
            });
        }
    };
    const handleSaveProfile = async () => {
        try {
            await apiService.put(`/users/${id}/profile`, {
                username: editUsername,
                bio: editBio,
                disabilityStatus: editDisability,
            }, token);
            const updatedUserData = await apiService.get<User>(`/users/${id}`, token);
            setUser(updatedUserData);
            setIsEditing(false);
            messageApi.open({type: "success", content: "Profile updated!"});
        } catch (error) {
            messageApi.open({type: "error", content: `Could not save: ${error}`});
        }
    };

    const handleCancelEdit = () => {
        setEditUsername(user?.username ?? "");
        setEditBio(user?.bio ?? "");
        setEditDisability(user?.disabilityStatus ?? "HEARING");
        setIsEditing(false);
    };


    useEffect(() => {
        if (!isReady) return;

        const fetchUser = async () => {
            if (!token) {
                router.push("/");
                return;
            }

            try {
                if (!isReady) return;
                const user: User = await apiService.get<User>(`/users/${id}`, token);
                setUser(user);
                setEditUsername(user.username ?? "");
                setEditBio(user.bio ?? "");
                setEditDisability(user.disabilityStatus ?? "HEARING")
            } catch (error) {
                if (error instanceof Error) {
                    alert(
                        `Something went wrong while fetching the user:\n${error.message}`,
                    );
                } else {
                    console.error("An unknown error occurred while fetching the user.");
                }
            }
        };
        fetchUser();
    }, [apiService, isReady, token, router]);

    return (
        <div className="profile-container">
            {contextHolder}
            <div className="auth-card form-transition">

                <div style={{display: "flex", alignItems: "center", gap: 16, marginBottom: 24}}>
                    <Avatar size={56} style={{backgroundColor: "#22426b", fontSize: 18, flexShrink: 0}}>
                        {user?.username?.slice(0, 2).toUpperCase() ?? "?"}
                    </Avatar>
                    <div>
                        <div style={{fontSize: 20, fontWeight: 600, color: "#171717"}}>{user?.username}</div>
                        <Badge
                            status={user?.status === "ONLINE" ? "success" : "default"}
                            text={user?.status === "ONLINE" ? "Online" : "Offline"}
                        />
                    </div>
                </div>

                <Divider/>

                {!isEditing ? (
                    <>
                        <div className="profile-section" style={{marginBottom: 12}}>
                            <div className="profile-section-label">Bio</div>
                            <div className="profile-section-value">{user?.bio || "—"}</div>
                        </div>
                        <div className="profile-section" style={{marginBottom: 12}}>
                            <div className="profile-section-label">Accessibility</div>
                            <div className="profile-section-value">
                                {user?.disabilityStatus === "DEAF" ? "Deaf" : "Hearing"}
                            </div>
                        </div>
                        <div className="profile-section" style={{marginBottom: 24}}>
                            <div className="profile-section-label">Member Since</div>
                            <div className="profile-section-value">
                                {user?.creationDate
                                    ? new Date(user.creationDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })
                                    : "—"}
                            </div>
                        </div>

                        {isOwnProfile && (
                            <Button type="primary" onClick={() => setIsEditing(true)} className="login-button">
                                Edit Profile
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <ConfigProvider theme={{
                            components: {
                                Input: {colorBgContainer: "#ffffff", colorText: "#171717", colorBorder: "#d9d9d9"},
                            }
                        }}>
                            <Form layout="vertical" size="large" variant="outlined">
                                <Form.Item label="Username" className={styles.loginMask} style={{marginBottom: "12px"}}>
                                    <Input value={editUsername} onChange={e => setEditUsername(e.target.value)}/>
                                </Form.Item>
                                <Form.Item label="Bio" className={styles.loginMask} style={{marginBottom: "12px"}}>
                                    <Input.TextArea
                                        rows={3}
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                    />
                                </Form.Item>
                                <Form.Item label="Accessibility Status" className={styles.loginMask} style={{marginBottom: "12px"}}>
                                    <Radio.Group
                                        value={editDisability}
                                        onChange={e => setEditDisability(e.target.value as "HEARING" | "DEAF")}
                                    >
                                        <Radio value="HEARING">Hearing</Radio>
                                        <Radio value="DEAF">Deaf</Radio>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item style={{marginBottom: "8px"}}>
                                    <Button type="primary" onClick={handleSaveProfile} className="login-button">
                                        Save Changes
                                    </Button>
                                </Form.Item>
                                <Form.Item>
                                    <Button onClick={handleCancelEdit} className="login-button">
                                        Cancel
                                    </Button>
                                </Form.Item>
                            </Form>
                        </ConfigProvider>
                    </>
                )}

                <Divider/>

                <div style={{display: "flex", gap: 12}}>
                    <Button onClick={() => router.push("/users")} size="large" style={{flex: 1}}>
                        Back
                    </Button>
                    <Button danger onClick={handleLogout} size="large" style={{flex: 1}}>
                        Logout
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default Profile;
