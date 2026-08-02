import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
    const value = process.env[name];
    if (!value){
        throw new Error(`Missing environment variable: ${name}`)
    }
    return value;
}

export const env = {
    ADMIN_USER: required('ADMIN_USER'),
    ADMIN_PASSWORD: required('ADMIN_PASSWORD')
}