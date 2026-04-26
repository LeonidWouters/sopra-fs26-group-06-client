"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import {useRouter} from "next/navigation"; // use NextJS router for navigation
import {useApi} from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import {User} from "@/types/user";
import {Button, ConfigProvider, Form, Input, Modal, Segmented, Select} from "antd";
import {useState} from "react";
import {PasswordInput} from "antd-password-input-strength";
import Image from "next/image";
import styles from "@/styles/page.module.css";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface FormFieldProps {
    label: string;
    value: string;
}

const Login: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const [form] = Form.useForm();
    // useLocalStorage hook example use
    // The hook returns an object with the value and two functions
    // Simply choose what you need from the hook:
    const {set: setId} = useLocalStorage<string>("id", "");
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const {
        // value: token, // is commented out because we do not need the token value
        set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
        // clear: clearToken, // is commented out because we do not need to clear the token when logging in
    } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
    // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

    const handleLogin = async (values: FormFieldProps) => {
        try {
            // Call the API service and let it handle JSON serialization and error handling
            const response = await apiService.post<User>("/login", values);

            // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
            if (response.token) {
                setToken(response.token);
            }
            if (response.id) {
                setId(String(response.id));
            }
            // Navigate to the user overview
            router.push(`/mainpage`);
        } catch (error) {
            if (error instanceof Error && error.message.includes("Wrong Password!")) {
                Modal.error({
                    title: "Error",
                    content: "The password you entered is wrong. Please try again!",
                });
            } else if (
                error instanceof Error &&
                error.message.includes("This User does not exist!")
            ) {
                Modal.error({
                    title: "Error",
                    content:
                        "This username does not exist. Please try again or sing up!",
                });
            } else if (error instanceof Error) {
                alert(`Something went wrong during the login:\n${error.message}`);
            } else {
                console.error("An unknown error occurred during login.");
            }
        }

    };
    const handleRegistration = async (values: FormFieldProps) => {
        try {
            const response = await apiService.post<User>("/users", values);
            if (response.token) {
                setToken(response.token);
            }

            if (response.id) {
                setId(String(response.id));
            }
            router.push(`/mainpage/`);
        } catch (error) {
            if (
                error instanceof Error &&
                error.message.includes("The username provided is not unique")
            ) {
                Modal.error({
                    title: "Error",
                    content:
                        "This username is already taken. Please log in if you already have an account or choose a different one.",
                });
            } else if (error instanceof Error) {
                alert(`Something went wrong during registration:\n${error.message}`);
            } else {
                console.error("An unknown error occurred during registration.");
            }
        }
    };
    const handleModeChange = (mode: "login" | "register") => {
        setAuthMode(mode);
        form.resetFields();
    };
    const [level, setLevel] = useState(0);
    const minLevel = 1;
    const errorMessage = "Password is too weak";

    return (
        <div className="login-container">
            <div className="login-left-panel">
                <Image
                    src="/unnamed-Photoroom.png"
                    alt="ComunicALL"
                    width={180}
                    height={50}
                    style={{width: "auto", maxWidth: "180px", height: "auto", maxHeight: "50px"}}
                />
                <h1>Accessible calls,<br/>for everyone.</h1>
                <p>Real-time subtitles, shared notes and transcripts — built for deaf and hearing users.</p>
                <div className="login-feature">
                    <div className="login-feature-icon">🎙️</div>
                    <div className="login-feature-text">
                        <strong>Live subtitles</strong>
                        <span>Speech-to-text transcribed during every call</span>
                    </div>
                </div>
                <div className="login-feature">
                    <div className="login-feature-icon">📝</div>
                    <div className="login-feature-text">
                        <strong>Shared notes</strong>
                        <span>Collaborate in real-time with markdown</span>
                    </div>
                </div>
                <div className="login-feature">
                    <div className="login-feature-icon">📄</div>
                    <div className="login-feature-text">
                        <strong>Auto transcripts</strong>
                        <span>Every call saved and downloadable</span>
                    </div>
                </div>
                <div className="login-left-footer">sopra-fs26 · group 06</div>
            </div>
            <div className="login-right-panel">
            <div className="auth-card">
                <div style={{textAlign: "center", marginBottom: 20}}>
                    <div style={{fontSize: 22, fontWeight: 700, color: "#1a1a2e"}}>
                        {authMode === "login" ? "Welcome back" : "Create an account"}
                    </div>
                    <div style={{fontSize: 13, color: "#6b7280", marginTop: 4}}>
                        {authMode === "login" ? "Sign in to continue" : "Join ComunicALL today"}
                    </div>
                </div>
                <div style={{width: "100%", maxWidth: "280px", margin: "0 auto"}}>
                    <ConfigProvider
                        theme={{
                            components: {
                                Segmented: {
                                    itemColor: '#888888',
                                    itemSelectedColor: '#ffffff',
                                    itemSelectedBg: '#6B21D6',
                                    trackBg: '#f0f0f0',
                                },
                                Select: {
                                    colorBorder: "gray",
                                    colorTextPlaceholder: "#888888",
                                    colorIcon: "#888888",
                                    colorBgContainer: "#ffffff",
                                    colorBgElevated: "#ffffff",
                                    colorText: "#000000",
                                    controlItemBgHover: "#f0f0f0",
                                    controlItemBgActive: "#e6f4ff",
                                },
                            },
                        }}
                    >
                        <Segmented
                            block
                            size="middle"
                            shape="round"
                            value={authMode}
                            onChange={handleModeChange}
                            options={[
                                {label: 'Sign In', value: 'login'},
                                {label: 'Sign Up', value: 'register'},
                            ]}
                            style={{width: "100%", marginBottom: "15px"}}
                        />
                        <div key={authMode} className="form-transition">
                            {authMode === "login" ? (
                                <Form
                                    form={form}
                                    name="login"
                                    size="large"
                                    variant="outlined"
                                    onFinish={handleLogin}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        className={styles.loginMask}
                                        rules={[{required: true, message: "Please input your username!"}]}
                                    >
                                        <Input placeholder="Enter username"/>
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        className={styles.loginMask}
                                        rules={[{
                                            required: true,
                                            message: "Please input a valid password!",
                                        }]}
                                    >
                                        <Input.Password placeholder="Enter password"/>
                                    </Form.Item>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" className="login-button">
                                            Login
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ) : (
                                <Form
                                    form={form}
                                    name="register"
                                    size="large"
                                    variant="outlined"
                                    onFinish={handleRegistration}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        className={styles.loginMask}
                                        style={{marginBottom: "12px"}}
                                        rules={[{required: true, message: "Please enter a username!"}]}
                                    >
                                        <Input placeholder="Enter username"/>
                                    </Form.Item>
                                    <Form.Item
                                        name="name"
                                        label="Name"
                                        className={styles.loginMask}
                                        style={{marginBottom: "12px"}}
                                        rules={[{required: true, message: "Please input your name!"}]}
                                    >
                                        <Input placeholder="Enter name"/>
                                    </Form.Item>
                                    <Form.Item
                                        name="bio"
                                        label="Bio"
                                        className={styles.loginMask}
                                        style={{marginBottom: "12px"}}
                                        rules={[{required: true, message: "Please enter a bio!"}]}
                                    >
                                        <Input.TextArea
                                            rows={3}
                                            placeholder="Tell something about you"
                                            count={{
                                                show: true,
                                                max: 60,
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="disabilityStatus"
                                        label="Status (Hearing / Deaf)"
                                        className={styles.loginMask}
                                        style={{marginBottom: "12px"}}
                                        rules={[{required: true, message: "Please select your status!"}]}
                                    >
                                        <Select placeholder="Select your status">
                                            <Select.Option value="HEARING">Hearing</Select.Option>
                                            <Select.Option value="DEAF">Deaf</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        className={styles.loginMask}
                                        style={{marginBottom: "12px"}}
                                        rules={[{required: true, message: "Create new password"}, {
                                            validator: async () => {
                                                return level >= minLevel
                                                    ? Promise.resolve()
                                                    : Promise.reject(errorMessage);
                                            },
                                        }]}
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
                                            placeholder="Enter password"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="repeatpassword"
                                        label="Confirm password"
                                        className={styles.loginMask}
                                        dependencies={["password"]}
                                        style={{marginBottom: "12px"}}
                                        rules={[
                                            {required: true, message: "Please confirm your password"},
                                            ({getFieldValue}) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue("password") === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error("The passwords do not match!"));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password placeholder="Confirm password"/>
                                    </Form.Item>
                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            className="login-button"
                                            style={{marginTop: "25px"}}
                                        >
                                            Register
                                        </Button>
                                    </Form.Item>
                                </Form>
                            )}
                        </div>
                    </ConfigProvider>
                </div>
            </div>
            </div>
            </div>
    );
};

export default Login;
