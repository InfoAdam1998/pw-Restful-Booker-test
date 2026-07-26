import { APIRequestContext } from '@playwright/test';


export class BookingApi {
    private readonly request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    async getToken(username: string, password: string){
        const response = await this.request.post('/auth', {
            data: {
                username,
                password
            }
        })

        const body = await response.json();
        return body.token;
    }

    async createBooking(bookingData: object){
        return await this.request.post('/booking', {
            data: bookingData
        })
    }

    async getBooking(bookingId: number){
        return await this.request.get(`/booking/${bookingId}`);
    }

    async updateBooking(bookingId: number, bookingData: object, token: string){
        return await this.request.put(`/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
            data: bookingData
        })
    }

    async patchBooking(bookingId: number, bookingData: object, token: string){
        return await this.request.patch(`/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            },
            data: bookingData
        })
    }

    async deleteBooking(bookingId: number, token: string){
        return this.request.delete(`/booking/${bookingId}`, {
            headers: {
                Cookie: `token=${token}`
            }
        })
    }
}