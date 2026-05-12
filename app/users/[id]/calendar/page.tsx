"use client";
import React, {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {Button, Modal, Form, Input, DatePicker, Badge, Tooltip, Spin, Select} from "antd";
import {
    LogoutOutlined, AppstoreOutlined, TeamOutlined,
    FileTextOutlined, CalendarOutlined, PlusOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import "react-big-calendar/lib/css/react-big-calendar.css";
import mainStyles from "@/styles/mainpage.module.css";
import styles from "./calendar.module.css";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getAvatarColor, getAvatarInitials } from "@/utils/avatarColor";
import { User } from "@/types/user";
import { View } from "react-big-calendar";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import type { Event as RBCEvent } from "react-big-calendar";



const djlocalizer = dayjsLocalizer(dayjs);

export interface CalendarEvent extends RBCEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    color?: string;
    owner : number;
    invitedUser : number;
}


interface EventModalProps {
    open: boolean;
    onClose: () => void;
    existingEvent?: CalendarEvent | null;
    initialDate?: Date;
    onSave: (event: CalendarEvent) => void;
    onDelete?: (id: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({
    open, onClose, existingEvent, initialDate, onSave, onDelete,
}) => {
    const [friends, setFriends] = useState<User[]>([]);//get friends for invite dropdown
    const [form] = Form.useForm();
    const apiService = useApi();
    const {
        value :id,
    } = useLocalStorage<string>("id", "");
    const {
        value: token,
    } = useLocalStorage<string>("token", "");

    useEffect(() => {
        if(!id || !token) return;
        const loadFriends = async() =>{
            const friends = await apiService.get<User[]>(`/users/${id}/friends`, token);//fetch all current friends to display in dropdown for meeting
            setFriends(friends);
        }
        loadFriends();
    }, [apiService, id,token]);

    useEffect(() => {
        if (open) {
            const start = existingEvent?.start ?? initialDate ?? new Date();
            const end = existingEvent?.end ?? new Date(new Date(start).getTime() + 60 * 60 * 1000);
            form.setFieldsValue({
                title: existingEvent?.title ?? "",
                description: existingEvent?.description ?? "",
                start: dayjs(start),
                end: dayjs(end),
            });
        } else {
            form.resetFields();
        }
    }, [open, existingEvent, initialDate, form]);

    const handleSave = () => {
        form.validateFields().then(values => {
            const payload = {
                id: "",//set in backend
                title: values.title,
                description: values.description ?? "",
                start: values.start.format("YYYY-MM-DDTHH:mm:ss"),
                end: values.end.format("YYYY-MM-DDTHH:mm:ss"),
                color: "#6B21D6",
                owner : Number(id) ,
                invitedUser : values.invitedUserId,
            };

            console.log(payload);
            console.log(JSON.stringify(payload));
            const persist = apiService.post(`/meetings/${id}`,payload,token);
            console.log(persist);
            onSave({
                ...payload,
                start: new Date(payload.start),
                end: new Date(payload.end),
            });

            onClose();
        });
    };

    return (
        <Modal
            forceRender
            title={existingEvent ? "Edit Scheduled Call" : "Schedule a Call"}
            open={open}
            onCancel={onClose}
            footer={[
                existingEvent && onDelete ? (
                    <Button key="del" danger onClick={() => { onDelete!(existingEvent.id); onClose(); }}>
                        Delete
                    </Button>
                ) : null,
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="save" type="primary" onClick={handleSave}
                    style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", border: "none" }}>
                    {existingEvent ? "Save Changes" : "Schedule"}
                </Button>,
            ].filter(Boolean)}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item label="Title" name="title"
                    rules={[{ required: true, message: "Please enter a title" }]}>
                    <Input placeholder="e.g. Call with Leon" />
                </Form.Item>
                <Form.Item label="Description" name="description">
                    <Input.TextArea rows={2} placeholder="Optional notes..." />
                </Form.Item>
                <Form.Item label="start" name="start"
                    rules={[{ required: true, message: "Please pick a start time" }]}>
                    <DatePicker showTime={{ minuteStep: 15 }} format="DD MMM YYYY HH:mm" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="end" name="end"
                    rules={[{ required: true, message: "Please pick an end time" }]}>
                    <DatePicker showTime={{ minuteStep: 15 }} format="DD MMM YYYY HH:mm" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="Invite Friend" name="invitedUserId" rules={[{ required: true, message: "Please pick a user to invite" }]}>
                    <Select
                        placeholder="Select a friend to invite"
                        style={{width: "100%"}}
                    >
                        {friends.map(friend => (
                            <Select.Option key={friend.id} value={friend.id}>
                                {friend.name} (@{friend.username})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const CalendarPage: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();
    const { token, isReady } = useAuth();
    const { value: loggedInId } = useLocalStorage<string>("id", "");
    const { clear: clearToken } = useLocalStorage<string>("token", "");
    const { clear: clearId } = useLocalStorage<string>("id", "");
    const [me, setMe] = useState<User | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
    const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>(undefined);
    const [currentView, setCurrentView] = useState<View>('week');
    const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (!isReady) return;
        if (!token) { router.push("/"); return; }
        const load = async () => {
            try {
                const fetchedMe = await apiService.get<User>(`/users/${loggedInId}`, token);
                setMe(fetchedMe);
                const meetings = await apiService.get<CalendarEvent[]>(`/meetings/${fetchedMe.id}`, token);

                const normalizedMeetings = meetings.map(meeting => ({
                    ...meeting,
                    start: new Date(meeting.start),
                    end: new Date(meeting.end),
                }));
                setEvents(normalizedMeetings);
                console.log(normalizedMeetings);
            } catch (e) { console.error(e); }
        };
        load();
    }, [isReady, token, router, apiService, loggedInId]);

    const handleSave = (event: CalendarEvent) => {
        setEvents(prev => {
            const exists = prev.some(e => e.id === event.id);
            return exists ? prev.map(e => e.id === event.id ? event : e) : [...prev, event];
        });
    };

    const handleDelete = (id: string) => {
        apiService.delete(`/meetings/${id}`, token);
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const openCreate = (date?: Date) => {
        setModalEvent(null);
        setModalInitialDate(date);
        setModalOpen(true);
    };

    const openEdit = (event: CalendarEvent) => {
        setModalEvent(event);
        setModalInitialDate(undefined);
        setModalOpen(true);
    };

    if (!isReady) {
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
                    <div className={mainStyles.sbLogo} onClick={() => router.push("/mainpage")} style={{ cursor: "pointer" }}>
                        <Image src="/banner_logo.png" alt="Logo" width={32} height={32}
                            style={{ width: 32, height: 32, objectFit: "contain" }} />
                    </div>
                    <Tooltip title="Rooms" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => router.push("/mainpage")}>
                            <AppstoreOutlined />
                        </div>
                    </Tooltip>
                    <Tooltip title="Friends" placement="right">
                        <Badge count={me?.pendingFriendRequests?.length ?? 0} size="small" offset={[-4, 4]}>
                            <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/friends`)}>
                                <TeamOutlined />
                            </div>
                        </Badge>
                    </Tooltip>
                    <Tooltip title="Transcripts & Notes" placement="right">
                        <div className={mainStyles.sbIcon} onClick={() => router.push(`/users/${loggedInId}/transcripts`)}>
                            <FileTextOutlined />
                        </div>
                    </Tooltip>
                    <Tooltip title="Calendar" placement="right">
                        <div className={`${mainStyles.sbIcon} ${mainStyles.sbIconActive}`}>
                            <CalendarOutlined />
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
                            <LogoutOutlined />
                        </div>
                    </Tooltip>
                    <Tooltip title="My Profile" placement="right">
                        <div className={mainStyles.sbAvatar}
                            style={me?.profilePicture ? {} : { backgroundColor: getAvatarColor(me?.username ?? "") }}
                            onClick={() => router.push(`/users/${loggedInId}`)}>
                            {me?.profilePicture
                                ? <img src={me.profilePicture} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt="avatar" />
                                : getAvatarInitials(me?.username ?? "")
                            }
                        </div>
                    </Tooltip>
                </div>
            </aside>

            <div className={mainStyles.container}>
                <div className={mainStyles.mainContent}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}>My Schedule</h1>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openCreate()}
                            style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)", border: "none" }}
                        >
                            Schedule Call
                        </Button>
                    </div>
                    <div className={styles.calendarWrapper}>
                        <Calendar
                            localizer={djlocalizer}
                            events={events}
                            onView={setCurrentView}
                            view={currentView}
                            date={currentDate}
                            onNavigate={date => {
                                setCurrentDate(date);
                            }}
                            step={30}
                            timeslots={2}
                            startAccessor="start"
                            endAccessor="end"
                            titleAccessor="title"
                            style={{ height: 700 }}
                            onSelectEvent={(e) => openEdit(e as CalendarEvent)}
                            onSelectSlot={(slot: { start: Date }) => openCreate(slot.start)}
                            selectable
                            popup
                        />
                    </div>
                </div>
            </div>

            <EventModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                existingEvent={modalEvent}
                initialDate={modalInitialDate}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default CalendarPage;
