// your code here for S2 to display a single user profile after having clicked on it
// each user has their own slug /[id] (/1, /2, /3, ...) and is displayed using this file
// try to leverage the component library from antd by utilizing "Card" to display the individual user
// import { Card } from "antd"; // similar to /app/users/page.tsx

"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import { Avatar, Button, Card, Descriptions, Form, Input, message } from "antd";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useAuth } from "@/hooks/useAuth";
const { Meta } = Card;

interface FormFieldProps {
  password: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const { id } = useParams();
  const { token, isReady } = useAuth();
  const [canChange, setCanChange] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  const {
    clear: clearToken,
  } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");

  const handleLogout = (): void => {
    // Clear token using the returned function 'clear' from the hook
    apiService.put("/users/logout", null, token); // make a PUT request to the backend to invalidate the token, pass the token in the header for authentication
    clearToken();
    router.push("/");
  };

  const redirect = (): void => {
    router.push("/users");
  };

  const handlePassword = async () => {
    try {
      const res = await apiService.get<boolean>(`/users/${id}/verifier`, token);
      setCanChange(res);
    } catch {
      messageApi.open({
        type: "error",
        content: "this is not your user",
      });
    }
  };
  const changePassword = async (values: FormFieldProps) => {
    try {
      await apiService.put<User>(
        `/users/${id}`,
        values,
        token,
      );
      await apiService.put("/users/logout", null, token);
      clearToken();
      router.push("/");
    } catch (error) {

      messageApi.open({
        type: "error",
        content: `password could not be changed because of ${error}`,
      });
    }
  };

  useEffect(() => {
    if (!isReady) return; // wait for hydration

    const fetchUser = async () => {
      if (!token) {
        router.push("/"); // redirect if token missing
        return;
      }

      try {
        if (!isReady) return;
        const user: User = await apiService.get<User>(`/users/${id}`, token);
        setUser(user);
        console.log("Fetched user:", user);
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
    <div className="card-container">
      {contextHolder}
      <Card
        loading={!user}
        style={{ width: "auto" }}
        title={"Profile"}
      >
        <Button onClick={redirect} type="primary">
          See Users
        </Button>
        <Meta
          className={"userAvatar"}
          avatar={<Avatar src="/User-Profile-PNG-Image-2392518013.png" />}
          title={user?.username}
        />
        <Descriptions
          column={1}
          layout={"horizontal"}
          className="descriptions"
          bordered={true}
        >
          <Descriptions.Item label="ID">{user?.id}</Descriptions.Item>
          <Descriptions.Item label="Username">
            {user?.username}
          </Descriptions.Item>
          <Descriptions.Item label="Bio">{user?.bio}</Descriptions.Item>
          <Descriptions.Item label="Date">
            {user?.creationDate}
          </Descriptions.Item>
        </Descriptions>
        <Button onClick={handleLogout} type="primary" style={{ margin: "1%" }}>
          Logout
        </Button>
        <Button onClick={handlePassword} style={{ marginLeft: "41%" }}>
          edit Password
        </Button>

        {canChange && (
          <Form onFinish={changePassword}>
            <Form.Item
              name="password"
              label="Password"
              rules={[{
                required: true,
                message: "Please input a new valid password!",
              }]}
            >
              <Input.Password placeholder="Enter new password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default Profile;
