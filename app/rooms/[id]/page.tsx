"use client";

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, Form, Input} from "antd";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";




const RoomPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { token, isReady } = useAuth();
    const { id } = useParams();
    const clientRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const wsRef = useRef<WebSocket>(null);
    const [messages, setMessages] = useState<unknown[]>([]);

    const {
        clear: clearToken,
    } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");

    const leaveRoom = (): void => {
        // Clear token using the returned function 'clear' from the hook
        apiService.put(`/rooms/${id}/leave`, null, token);
        router.push("/mainpage");
    };

    const createOffer= async() => {
        try {
            peerConnection.current = new RTCPeerConnection();
            peerConnection.current.setConfiguration({
                iceServers: [
                    {urls: "stun:stun.l.google.com:19302"},
                ]
            })
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("New ICE candidate:", event.candidate);
                }
            }
        }
        catch (error){
                console.error("Error creating offer", error);
            }
        }
    useEffect(() => {
        if (!isReady) return;
        const socket = new WebSocket("ws://localhost:8080/ws/SocketsHandler");
        wsRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({token}));
        }
        socket.onmessage = (event) => {
            setMessages((prev) => [...prev, event.data]);
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        return () => {
            socket.close(1000, "component unmounted");
        };
    }, [apiService, token, isReady]);

    const send = (data:string) => {
        wsRef.current?.send(JSON.stringify({data}));
    };


    useEffect(() => {
        if(!isReady) return; //ensure token is loaded
        let stream: MediaStream | null;
        const startMediaDevice = async() =>{
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                clientRef.current!.srcObject = stream;
            }
           catch (error) {
                console.error("Error accessing media devices.", error);
           }
        }
        startMediaDevice();
        return() =>{
            stream?.getTracks().forEach(track => track.stop());
            if (clientRef.current) {
                clientRef.current.srcObject = null
            };
        }
    }, [apiService, token, isReady]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "blueviolet"}} >
            <div>
            <video ref ={clientRef} autoPlay muted />
            </div>
            <div>
                <Button onClick={leaveRoom} type="primary">Leave Video Call</Button>
                <Form
                    onFinish={(values) => send(values)}>
                    <Form.Item name="message" label="Message">
                    <Input></Input>
                    </Form.Item>
                    <Button  htmlType="submit" type="primary">Send Message</Button>
                </Form>


            </div>
        </div>
    );
};

export default RoomPage;