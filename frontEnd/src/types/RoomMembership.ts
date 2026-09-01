import type { RoleType } from "./RoleType";

export interface RoomMembership {
    roomId: string;
    name: string;
    role: RoleType;
}
