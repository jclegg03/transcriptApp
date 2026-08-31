import type { UserType } from "./UserType";

export interface RoomType {
    id: number;
    name: string;
    users: UserType[];
    dateCreated: Date;
    isActive: boolean;
}