"use client";

import React, {useEffect, useRef} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button} from "antd";
import {useApi} from "@/hooks/useApi";
import {useAuth} from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";




const RoomPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { token, isReady } = useAuth();
    const { id } = useParams();

    const {
        clear: clearToken,
    } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");

    const leaveRoom = (): void => {
        // Clear token using the returned function 'clear' from the hook
        apiService.put(`/rooms/${id}/leave`, null, token);
        router.push("/mainpage");
    };
    const videoRef = useRef(null);
    useEffect(() => {
        if(!isReady) return; //ensure token is loaded
        let Stream;
        const startMediaDevice = async() =>{
            try {
                Stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoRef.current.srcObject = Stream;
            }
           catch (error) {
                console.error("Error accessing media devices.", error);
           }
        }
        startMediaDevice();
    }, [apiService, token, isReady]);
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "blueviolet"}} >
            <div>
            <video ref ={videoRef} autoPlay={true} muted />
            </div>
            <div>
                <Button onClick={leaveRoom} type="primary">Leave Video Call</Button>
            </div>


        </div>
    );
};

export default RoomPage;