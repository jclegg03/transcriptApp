import type { RoleType } from "./RoleType";

export interface UserType {
    id: number;
    role: RoleType;
    name: string;
}