export class User {
    id: string;
    name: string;
    password: string;
    email: string;
    refreshToken: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
