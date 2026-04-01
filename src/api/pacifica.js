import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

export const getLeaderboard = async (period = '1d', limit = 50) => {
    const response = await api.get('api/leaderboard', {
        params: {period, limit},
    })
    return response.data
}