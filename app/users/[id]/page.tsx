"use client";
import {Button, Form, Input, Radio, message} from "antd";
import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";
import {User} from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import {useAuth} from "@/hooks/useAuth";
import mainStyles from "@/styles/mainpage.module.css";
import profileStyles from "@/styles/profile.module.css";
import {getAvatarColor, getAvatarInitials} from "@/utils/avatarColor";
import {LogoutOutlined} from "@ant-design/icons";
import Image from "next/image";
import {PasswordInput} from "antd-password-input-strength";


interface FormFieldProps {
    password: string;
    confirmPassword: string;
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
    const [editUsername, setEditUsername] = useState<string>("");
    const [editBio, setEditBio] = useState<string>("");
    const [editDisability, setEditDisability] = useState<"HEARING" | "DEAF">("HEARING");
    const [level, setLevel] = useState(0);
    const minLevel = 1;
    const errorMessage = "Password is too weak";


    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.push("/");
            return;
        }

        const fetchUser = async () => {
            try {
                const user: User = await apiService.get<User>(`/users/${id}`, token);
                setUser(user);
                setEditUsername(user.username ?? "");
                setEditBio(user.bio ?? "");
                setEditDisability(user.disabilityStatus ?? "HEARING");
            } catch (error) {
                messageApi.open({type: "error", content: "Could not load user."});
            }
        };
        fetchUser();
    }, [apiService, isReady, token, id, router]);


    const handleLogout = (): void => {
        apiService.put("/users/logout", null, token);
        clearToken();
        clearId();
        router.push("/");
    };

    const changePassword = async (values: FormFieldProps) => {
        if (values.password !== values.confirmPassword) {
            messageApi.open({type: "error", content: "Passwords do not match."});
            return;
        }
        try {
            await apiService.put<User>(`/users/${id}/password`, {password: values.password}, token);
            await apiService.put("/users/logout", null, token);
            clearToken();
            clearId();
            router.push("/");
        } catch (error) {
            messageApi.open({type: "error", content: "Could not change password."});
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
            messageApi.open({type: "success", content: "Profile updated!"});
        } catch (error) {
            messageApi.open({type: "error", content: "Could not save"});
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className={mainStyles.container}>
            {contextHolder}
            <div className={mainStyles.navbar}>
                <div className={mainStyles.logoWrapper}>
                    <Image
                        src="/unnamed-Photoroom.png"
                        alt="CommunicALL"
                        width={200}
                        height={55}
                        style={{width: "auto", maxWidth: "200px", height: "100%", maxHeight: "55px"}}
                        onClick={() => router.push("/mainpage")}
                    />
                </div>
                <div className={mainStyles.navButtons}>
                    <Button color="default" variant="text"
                            onClick={() => router.push(`/mainpage`)}>
                        ← Back
                    </Button>
                    <Button color="danger" variant="text" icon={<LogoutOutlined/>}
                            onClick={handleLogout}>
                        Sign Out
                    </Button>
                </div>
            </div>
            <div className={mainStyles.mainContent}>
                <div className={profileStyles.card}>
                    <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                        <div style={{display: "flex", alignItems: "center", gap: 24}}>
                            <div style={{
                                width: 88,
                                height: 88,
                                borderRadius: "50%",
                                backgroundColor: getAvatarColor(user.username ?? ""),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 28,
                                fontWeight: 700,
                                color: "#fff",
                                flexShrink: 0,
                            }}>
                                {getAvatarInitials(user.username ?? "")}
                            </div>
                            <div>
                                <div style={{fontSize: 30, fontWeight: 600}}>{user.username}</div>
                                <span style={{
                                    background: user.status === "ONLINE" ? "#00c950" : "#8a8a8a",
                                    color: "white",
                                    borderRadius: 8,
                                    padding: "2px 10px",
                                    fontSize: 12
                                }}>
                                    {user.status === "ONLINE" ? "Online" : "Offline"}
                                </span>
                                <div style={{color: "#4a5565", marginTop: 8}}>{user.bio}</div>
                            </div>
                        </div>
                        <Button
                            type="primary"
                            onClick={() => router.push(`/users/${id}/transcripts`)}
                            style={{
                                background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                                border: "none",
                                borderRadius: 10,
                                height: 44,
                                padding: "0 24px",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            See latest transcripts/notes
                        </Button>
                    </div>
                </div>

                {isOwnProfile && (
                    <div className={profileStyles.card}>
                        <div style={{fontSize: 24, fontWeight: 600, color: "#101828"}}>Edit Profile</div>
                        <div style={{color: "#4a5565", marginTop: 4, marginBottom: 24}}>Change your username, bio or accessibility status</div>
                        <Form layout="vertical" onFinish={handleSaveProfile}>
                            <Form.Item label="Username">
                                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)}/>
                            </Form.Item>
                            <Form.Item label="Bio">
                                <Input.TextArea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)}
                                                placeholder="Tell us about yourself..."/>
                            </Form.Item>
                            <Form.Item label="Accessibility Status">
                                <Radio.Group value={editDisability} onChange={e => setEditDisability(e.target.value)}>
                                    <Radio value="HEARING">Hearing</Radio>
                                    <Radio value="DEAF">Deaf</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Button type="primary" htmlType="submit">Save Changes</Button>
                        </Form>
                    </div>
                )}

                {isOwnProfile && (
                    <div className={profileStyles.card}>
                        <div style={{fontSize: 24, fontWeight: 600, color: "#101828"}}>Change Password</div>
                        <div style={{color: "#4a5565", marginTop: 4, marginBottom: 24}}>You will be logged out after changing your password</div>
                        <Form layout="vertical" onFinish={changePassword}>
                            <Form.Item
                                label="New Password"
                                name="password"
                                rules={[
                                    {required: true, message: "Please enter a new password"},
                                    {
                                        validator: async () => {
                                            return level >= minLevel
                                                ? Promise.resolve()
                                                : Promise.reject(errorMessage);
                                        },
                                    }
                                ]}
                            >
                                <PasswordInput
                                    onLevelChange={setLevel}
                                    settings={{
                                        colorScheme: {
                                            levels: [
                                                "#ff4d4f",
                                                "#faad14",
                                                "#52c41a",
                                                "#52c41a",
                                                "#52c41a",
                                            ],
                                            noLevel: "#434343",
                                        },
                                        height: 5,
                                        alwaysVisible: false,
                                    }}
                                    placeholder="Enter new password"
                                />
                            </Form.Item>
                            <Form.Item
                                label="Confirm Password"
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    {required: true, message: "Please confirm your password"},
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("The passwords do not match!"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Confirm new password"/>
                            </Form.Item>
                            <Button type="primary" htmlType="submit">Update Password</Button>
                        </Form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;
