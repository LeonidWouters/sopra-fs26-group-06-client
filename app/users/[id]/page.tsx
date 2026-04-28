"use client";
import {Button, Form, Input, Radio, Tabs, message, Badge, Tooltip} from "antd";
import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";
import {User} from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import {useAuth} from "@/hooks/useAuth";
import mainStyles from "@/styles/mainpage.module.css";
import profileStyles from "@/styles/profile.module.css";
import {LogoutOutlined, AppstoreOutlined, TeamOutlined, ArrowLeftOutlined, FileTextOutlined} from "@ant-design/icons";
import {getAvatarColor, getAvatarInitials} from "@/utils/avatarColor";
import Image from "next/image";
import {PasswordInput} from "antd-password-input-strength";
import styles from "@/styles/mainpage.module.css";


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
    const [isFriend, setIsFriend] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [me, setMe] = useState<User | null>(null);


    useEffect(() => {
        if (!isReady) return;
        if (!token) {
            router.push("/");
            return;
        }

        const fetchUser = async () => {
            try {
                const user = await apiService.get<User>(`/users/${id}`, token);
                const friendsList = await apiService.get<User[]>(`/users/${id}/friends`, token);
                setUser(user);
                setEditUsername(user.username ?? "");
                setEditBio(user.bio ?? "");
                setEditDisability(user.disabilityStatus ?? "HEARING");
                const amIFriend = friendsList.some((friend) => {
                    return String(friend.id) === String(loggedInId);
                });
                setIsFriend(amIFriend);
                const waitingList = user.pendingFriendRequests ?? [];
                const requestWasSent = waitingList.some((requestId) => {
                    return String(requestId) === String(loggedInId);
                });
                setRequestSent(requestWasSent);
                if (String(loggedInId) !== String(id)) {
                    const fetchedMe: User = await apiService.get<User>(`/users/${loggedInId}`, token);
                    setMe(fetchedMe);
                } else {
                    setMe(user);
                }
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

    const handleAddFriend = async () => {
        try {
            await apiService.post(`/users/${id}/friend-request`, {}, token);
            setRequestSent(true);
            messageApi.open({type: "success", content: "Friend request sent!"});
        } catch (error) {
            messageApi.open({type: "error", content: "Could not send friend request."});
        }
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
        <div className={mainStyles.appShell}>
            {contextHolder}
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
                            <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/friends`)}>
                                <TeamOutlined/>
                            </div>
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Transcripts & Notes" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/transcripts`)}>
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
                        <div className={mainStyles.sbAvatar}
                             style={{backgroundColor: getAvatarColor(me?.username ?? "")}}
                             onClick={() => router.push(`/users/${loggedInId}`)}>
                            {getAvatarInitials(me?.username ?? "")}
                        </div>
                    </Tooltip>
                </div>
            </aside>
            <div className={mainStyles.container}>
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
                        <div style={{display: "flex", gap: 12}}>
                            {!isOwnProfile && !isFriend && !requestSent && (
                                <Button onClick={handleAddFriend}>+ Add Friend</Button>
                            )}
                            {!isOwnProfile && isFriend && (
                                <Button disabled>Friends</Button>
                            )}
                            {!isOwnProfile && requestSent && (
                                <Button disabled>Request Sent</Button>
                            )}
                        </div>
                    </div>
                </div>

                {isOwnProfile && (
                    <div className={profileStyles.card}>
                        <Tabs
                            defaultActiveKey="edit"
                            items={[
                                {
                                    key: "edit",
                                    label: "Edit Profile",
                                    children: (
                                        <>
                                            <div style={{color: "#4a5565", marginBottom: 24}}>Change your username, bio or accessibility status</div>
                                            <Form layout="vertical" onFinish={handleSaveProfile}>
                                                <Form.Item label="Username">
                                                    <Input value={editUsername} onChange={e => setEditUsername(e.target.value)}/>
                                                </Form.Item>
                                                <Form.Item label="Bio">
                                                    <Input.TextArea rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell us about yourself..."/>
                                                </Form.Item>
                                                <Form.Item label="Accessibility Status">
                                                    <Radio.Group value={editDisability} onChange={e => setEditDisability(e.target.value)}>
                                                        <Radio value="HEARING">Hearing</Radio>
                                                        <Radio value="DEAF">Deaf</Radio>
                                                    </Radio.Group>
                                                </Form.Item>
                                                <Button type="primary" htmlType="submit">Save Changes</Button>
                                            </Form>
                                        </>
                                    ),
                                },
                                {
                                    key: "security",
                                    label: "Security",
                                    children: (
                                        <>
                                            <div style={{color: "#4a5565", marginBottom: 24}}>You will be logged out after changing your password</div>
                                            <Form layout="vertical" onFinish={changePassword}>
                                                <Form.Item
                                                    label="New Password"
                                                    name="password"
                                                    rules={[
                                                        {required: true, message: "Please enter a new password"},
                                                        {
                                                            validator: async () => level >= minLevel
                                                                ? Promise.resolve()
                                                                : Promise.reject(errorMessage),
                                                        },
                                                    ]}
                                                >
                                                    <PasswordInput
                                                        onLevelChange={setLevel}
                                                        settings={{
                                                            colorScheme: {
                                                                levels: ["#ff4d4f", "#faad14", "#52c41a", "#52c41a", "#52c41a"],
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
                                                    dependencies={["password"]}
                                                    rules={[
                                                        {required: true, message: "Please confirm your password"},
                                                        ({getFieldValue}) => ({
                                                            validator(_, value) {
                                                                if (!value || getFieldValue("password") === value) return Promise.resolve();
                                                                return Promise.reject(new Error("The passwords do not match!"));
                                                            },
                                                        }),
                                                    ]}
                                                >
                                                    <Input.Password placeholder="Confirm new password"/>
                                                </Form.Item>
                                                <Button type="primary" htmlType="submit">Update Password</Button>
                                            </Form>
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </div>
                )}

            </div>
        </div>
        </div>
    );
};

export default Profile;
