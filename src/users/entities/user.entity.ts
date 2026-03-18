export class User {
    id: number;
    name: string;
    password: string;
    email: string;
    refreshToken: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
